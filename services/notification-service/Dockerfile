FROM node:20-alpine

WORKDIR /app

COPY shared/ ./shared/

COPY services/notification-service/package*.json ./services/notification-service/

RUN cd services/notification-service && npm install --production

COPY services/notification-service/ ./services/notification-service/

WORKDIR /app/services/notification-service

EXPOSE 3003

CMD ["node", "src/index.js"]
