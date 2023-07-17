import configs from "./config/config.json";
import {ConfigSchema, Credentials, EndpointConfig} from "./schema/config";
import RateLimit from "express-rate-limit"
import {apiKeyAuth} from "@vpriem/express-api-key-auth";
import {createProxyMiddleware} from "http-proxy-middleware";

import logger from "./logging";
import {isEmpty} from "lodash";
import express from "express";
import {config} from "dotenv";
import helmet from "helmet";
import cors from "cors";
import {sanitizeEnv} from "./utils/env";

config();
sanitizeEnv();
const port = process.env.PORT || 3000;
const apiMountPoint = process.env.API_MOUNT_POINT || "/api";
const corsWhitelist = process.env.CORS_WHITELIST?.split(',') ?? [];
const app = express();

app.use(cors({
    origin: corsWhitelist,
    preflightContinue: false
}))
app.use(apiKeyAuth(/^API_KEY/,));
app.use(helmet.contentSecurityPolicy({
    useDefaults: true
}))

const limiter = RateLimit({
    windowMs: 60 * 1000,
    max: 100
})
app.use(limiter);

function getAuth(credentials?: Credentials) {
    if (!credentials) {
        return;
    }

    switch (credentials.type) {
        case "apiKey":
            return `${credentials.value}`
        case "basic":
            return `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`
        default:
            return;
    }
}

function setEndpoint(endpoint: EndpointConfig) {
    const {target, path} = endpoint;
    const auth = getAuth(target.credentials);
    const fullPath = `${apiMountPoint}${path}`;

    logger.info(`Setting up endpoint ${fullPath}...`);
    logger.info(`Target: ${endpoint.target.url}`);
    logger.info(`Auth type: ${endpoint.target.credentials?.type ?? 'None'}`);

    app.use(fullPath, createProxyMiddleware({
        target: target.url,
        changeOrigin: true,

        ws: true,
        headers: auth ? {
            "x-api-key": auth
        } : undefined,
        pathRewrite: {
            [`^${fullPath}`]: "/"
        }
    }))
}

async function init() {
    logger.info(`Setting up configuration...`);
    const configurations = await ConfigSchema.safeParseAsync(configs.servers);
    if (!configurations.success) {
        logger.error(`Failed to parse configuration: \n ${configurations.error.errors.map((error) => error.message).join('\n')}`);
        return;
    }
    if (isEmpty(configurations.data)) {
        logger.error(`No configuration found. Terminating...`);
        throw Error(`No configuration found. Terminating...`);
    }
    logger.info(`Configuration loaded successfully.`);
    configurations.data.forEach((endpoint) => {
        setEndpoint(endpoint);
    });
}

init().then(() => {
    app.listen(port, () => {
        logger.info(`Proxy server is running on port ${port}`);
    })
}).catch((e) => {
    logger.error(`Failed to initialize app:  ${e.message}\n`)
});
