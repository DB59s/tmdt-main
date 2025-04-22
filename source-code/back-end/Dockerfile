FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=9006

EXPOSE 9006

CMD ["npm", "start"]
