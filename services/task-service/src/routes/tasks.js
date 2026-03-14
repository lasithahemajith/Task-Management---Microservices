'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');
const { query } = require('../db');
const { publishTaskEvent } = require('../kafka/producer');
const { authenticateToken } = require('../middleware/auth');
const { createLogger } = require('../../../../shared/utils/logger');

const logger = createLogger('task-service:routes');
const router = express.Router();

const VALID_STATUSES = ['pending', 'in_progress', 'completed'];

const tasksLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

// POST /tasks
router.post(
  '/tasks',
  tasksLimiter,
  authenticateToken,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
    body('status').optional().isIn(VALID_STATUSES).withMessage('Invalid status'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description = '', status = 'pending' } = req.body;
    const userId = req.user.id;

    try {
      const result = await query(
        'INSERT INTO tasks (title, description, status, user_id) VALUES (?, ?, ?, ?)',
        [title, description, status, userId],
      );
      const task = { id: result.insertId, title, description, status, user_id: userId };
      await publishTaskEvent('TASK_CREATED', task);
      logger.info('Task created', { taskId: task.id, userId });
      return res.status(201).json({ task });
    } catch (err) {
      logger.error('Create task error', { error: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// GET /tasks
router.get('/tasks', tasksLimiter, authenticateToken, async (req, res) => {
  try {
    const tasks = await query(
      'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id],
    );
    return res.json({ tasks });
  } catch (err) {
    logger.error('Get tasks error', { error: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /tasks/:id
router.get(
  '/tasks/:id',
  tasksLimiter,
  authenticateToken,
  [param('id').isInt({ min: 1 }).withMessage('Invalid task ID')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const tasks = await query(
        'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id],
      );
      if (tasks.length === 0) return res.status(404).json({ error: 'Task not found' });
      return res.json({ task: tasks[0] });
    } catch (err) {
      logger.error('Get task error', { error: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// PUT /tasks/:id
router.put(
  '/tasks/:id',
  tasksLimiter,
  authenticateToken,
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid task ID'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().trim(),
    body('status').optional().isIn(VALID_STATUSES).withMessage('Invalid status'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const userId = req.user.id;

    try {
      const existing = await query(
        'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
        [id, userId],
      );
      if (existing.length === 0) return res.status(404).json({ error: 'Task not found' });

      const current = existing[0];
      const title       = req.body.title       ?? current.title;
      const description = req.body.description ?? current.description;
      const status      = req.body.status      ?? current.status;

      await query(
        'UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ? AND user_id = ?',
        [title, description, status, id, userId],
      );

      const task = { ...current, title, description, status };

      const eventType = status === 'completed' ? 'TASK_COMPLETED' : 'TASK_UPDATED';
      await publishTaskEvent(eventType, task);

      logger.info('Task updated', { taskId: id, userId, eventType });
      return res.json({ task });
    } catch (err) {
      logger.error('Update task error', { error: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// DELETE /tasks/:id
router.delete(
  '/tasks/:id',
  tasksLimiter,
  authenticateToken,
  [param('id').isInt({ min: 1 }).withMessage('Invalid task ID')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const userId = req.user.id;

    try {
      const existing = await query(
        'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
        [id, userId],
      );
      if (existing.length === 0) return res.status(404).json({ error: 'Task not found' });

      await query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
      logger.info('Task deleted', { taskId: id, userId });
      return res.json({ message: 'Task deleted successfully' });
    } catch (err) {
      logger.error('Delete task error', { error: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

module.exports = router;
