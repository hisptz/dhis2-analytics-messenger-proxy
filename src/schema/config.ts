import {z} from "zod";


const APIKeyCredentials = z.object({
    type: z.literal('apiKey'),
    value: z.string()
});

const BasicCredentials = z.object({
    type: z.literal('basic'),
    username: z.string(),
    password: z.string()
})

const CredentialsSchema = z.discriminatedUnion("type", [
    APIKeyCredentials,
    BasicCredentials
]);

export type Credentials = z.infer<typeof CredentialsSchema>

export const EndpointConfigSchema = z.object({
    path: z.string().startsWith('/'),
    target: z.object({
        url: z.string().url(),
        credentials: CredentialsSchema.optional()
    })
})
export type EndpointConfig = z.infer<typeof EndpointConfigSchema>

export const ConfigSchema = z.array(EndpointConfigSchema)

export type Config = z.infer<typeof ConfigSchema>

