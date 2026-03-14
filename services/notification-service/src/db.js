'use strict';

const mysql = require('mysql2/promise');
const { createLogger } = require('../../../shared/utils/logger');

const logger = createLogger('notification-service:db');

let pool = null;

function getPool() {
  if (pool) return pool;

  pool = mysql.createPool({
    host:               process.env.MYSQL_HOST     || 'mysql',
    port:               parseInt(process.env.MYSQL_PORT || '3306', 10),
    user:               process.env.MYSQL_USER     || 'devtask',
    password:           process.env.MYSQL_PASSWORD || 'devtask_password',
    database:           process.env.MYSQL_DATABASE || 'devtask_db',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
  });

  logger.info('MySQL pool created');
  return pool;
}

async function query(sql, params) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

async function initSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id         INT          AUTO_INCREMENT PRIMARY KEY,
      user_id    INT          NOT NULL,
      message    TEXT         NOT NULL,
      event_type VARCHAR(50),
      task_id    INT,
      created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  logger.info('Notifications table ready');
}

module.exports = { query, initSchema };
