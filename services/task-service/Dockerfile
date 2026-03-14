FROM node:20-alpine

WORKDIR /app

COPY shared/ ./shared/

COPY services/task-service/package*.json ./services/task-service/

RUN cd services/task-service && npm install --production

COPY services/task-service/ ./services/task-service/

WORKDIR /app/services/task-service

EXPOSE 3002

CMD ["node", "src/index.js"]
