'use strict';

const express = require('express');
const cors    = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { createLogger } = require('../../../shared/utils/logger');

const logger = createLogger('api-gateway');
const PORT   = parseInt(process.env.PORT || '3000', 10);

const AUTH_SERVICE_URL         = process.env.AUTH_SERVICE_URL         || 'http://auth-service:3001';
const TASK_SERVICE_URL         = process.env.TASK_SERVICE_URL         || 'http://task-service:3002';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3003';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request logger
app.use((req, _res, next) => {
  logger.info('Incoming request', { method: req.method, url: req.originalUrl });
  next();
});

// Health check (gateway-level)
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'api-gateway' }),
);

// Route: /auth/* → auth-service
app.use(
  '/auth',
  createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    on: {
      error: (err, _req, res) => {
        logger.error('Auth proxy error', { error: err.message });
        res.status(502).json({ error: 'Auth service unavailable' });
      },
    },
  }),
);

// Route: /tasks* → task-service
app.use(
  '/tasks',
  createProxyMiddleware({
    target: TASK_SERVICE_URL,
    changeOrigin: true,
    on: {
      error: (err, _req, res) => {
        logger.error('Task proxy error', { error: err.message });
        res.status(502).json({ error: 'Task service unavailable' });
      },
    },
  }),
);

// Route: /notifications* → notification-service
app.use(
  '/notifications',
  createProxyMiddleware({
    target: NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    on: {
      error: (err, _req, res) => {
        logger.error('Notification proxy error', { error: err.message });
        res.status(502).json({ error: 'Notification service unavailable' });
      },
    },
  }),
);

// Fallback
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

app.listen(PORT, () => logger.info(`API Gateway listening on port ${PORT}`));
