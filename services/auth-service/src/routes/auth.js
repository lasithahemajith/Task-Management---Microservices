'use strict';

const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { query } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { createLogger } = require('../../../../shared/utils/logger');

const logger = createLogger('auth-service:routes');
const router = express.Router();

const JWT_SECRET     = process.env.JWT_SECRET     || 'change_this_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const profileLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

// POST /register
router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const hashed = await bcrypt.hash(password, 12);
      const result = await query(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name, email, hashed],
      );

      const userId = result.insertId;
      const token = jwt.sign({ id: userId, email, name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      logger.info('User registered', { userId, email });
      return res.status(201).json({ token, user: { id: userId, name, email } });
    } catch (err) {
      logger.error('Register error', { error: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// POST /login
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const users = await query('SELECT * FROM users WHERE email = ?', [email]);
      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = users[0];
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN },
      );

      logger.info('User logged in', { userId: user.id });
      return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
      logger.error('Login error', { error: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// GET /profile  (protected)
router.get('/profile', profileLimiter, authenticateToken, async (req, res) => {
  try {
    const users = await query(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [req.user.id],
    );
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user: users[0] });
  } catch (err) {
    logger.error('Profile error', { error: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
