FROM node:20-alpine

WORKDIR /app

# Copy shared utilities first
COPY shared/ ./shared/

# Copy service files
COPY services/auth-service/package*.json ./services/auth-service/

RUN cd services/auth-service && npm install --production

COPY services/auth-service/ ./services/auth-service/

WORKDIR /app/services/auth-service

EXPOSE 3001

CMD ["node", "src/index.js"]
