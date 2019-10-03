FROM node:dubnium-alpine
WORKDIR /usr/src/app
RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh
COPY ./package.json .
ARG COMMIT
ARG PULL_REQUEST
ARG CI_BRANCH
ENV COVERALLS_REPO_TOKEN=dGQ6EOiIdO5K4MbZ8HWnfnINSOV3liNbs
RUN npm install
COPY . .
RUN if [ "$CI_BRANCH" != "master" ]; then export CI_PULL_REQUEST=$PULL_REQUEST; fi
RUN npm test
#RUN npm run coverage
EXPOSE 8080
CMD [ "npm", "start"]
