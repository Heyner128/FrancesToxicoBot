FROM node:19

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY . .

CMD [ "npm", "start" ]