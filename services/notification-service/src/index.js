'use strict';

const express = require('express');
const cors    = require('cors');
const { initSchema } = require('./db');
const notificationRoutes = require('./routes/notifications');
const { startConsumer } = require('./kafka/consumer');
const { createLogger } = require('../../../shared/utils/logger');

const logger = createLogger('notification-service');
const PORT   = parseInt(process.env.PORT || '3003', 10);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'notification-service' }));
app.use('/', notificationRoutes);

app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  // Wait for DB
  for (let i = 0; i < 10; i++) {
    try {
      await initSchema();
      break;
    } catch (err) {
      logger.warn(`DB not ready, retrying (${i + 1}/10)…`, { error: err.message });
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  // Start Kafka consumer (retry until Kafka is up)
  for (let i = 0; i < 10; i++) {
    try {
      await startConsumer();
      break;
    } catch (err) {
      logger.warn(`Kafka not ready, retrying (${i + 1}/10)…`, { error: err.message });
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  app.listen(PORT, () => logger.info(`Notification service listening on port ${PORT}`));
}

start();
