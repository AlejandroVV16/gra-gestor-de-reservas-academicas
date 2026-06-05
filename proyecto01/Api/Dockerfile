FROM node:22

WORKDIR /app
COPY package*.json ./

USER root
RUN npm install

COPY . .

CMD ["npm", "start"]