'use strict';

const express = require('express');
const cors    = require('cors');
const { initSchema } = require('./db');
const authRoutes = require('./routes/auth');
const { createLogger } = require('../../../shared/utils/logger');

const logger = createLogger('auth-service');
const PORT   = parseInt(process.env.PORT || '3001', 10);

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth-service' }));

// Routes
app.use('/', authRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  // Retry DB connection
  for (let i = 0; i < 10; i++) {
    try {
      await initSchema();
      break;
    } catch (err) {
      logger.warn(`DB not ready, retrying (${i + 1}/10)…`, { error: err.message });
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  app.listen(PORT, () => logger.info(`Auth service listening on port ${PORT}`));
}

start();
