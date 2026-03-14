'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../db');
const { createLogger } = require('../../../../shared/utils/logger');

const logger = createLogger('notification-service:routes');
const router = express.Router();

const notifLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

// GET /notifications
router.get('/', notifLimiter, authenticateToken, async (req, res) => {
  try {
    const notifications = await query(
      `SELECT id, user_id, message, event_type, task_id, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id],
    );
    return res.json({ notifications });
  } catch (err) {
    logger.error('Get notifications error', { error: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
