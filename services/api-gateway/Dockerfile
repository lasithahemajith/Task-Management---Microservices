FROM node:20-alpine

WORKDIR /app

COPY shared/ ./shared/

COPY services/api-gateway/package*.json ./services/api-gateway/

RUN cd services/api-gateway && npm install --production

COPY services/api-gateway/ ./services/api-gateway/

WORKDIR /app/services/api-gateway

EXPOSE 3000

CMD ["node", "src/index.js"]
