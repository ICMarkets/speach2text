FROM node:dubnium-alpine
WORKDIR /usr/src/app
RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh
COPY ./package.json .
ARG COMMIT
ARG PULL_REQUEST
ARG CI_BRANCH
RUN npm install
COPY . .
EXPOSE 8080
CMD [ "npm", "start"]
