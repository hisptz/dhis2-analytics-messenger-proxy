FROM node:lts-bullseye-slim
LABEL authors="HISP Tanzania"

WORKDIR /proxy

COPY app /proxy/app/
COPY package.json /proxy/
COPY yarn.lock /proxy/

RUN yarn install --production

EXPOSE 3000

ENTRYPOINT ["node", "app/src/index.js"]
