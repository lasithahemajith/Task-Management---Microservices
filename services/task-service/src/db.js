'use strict';

const mysql = require('mysql2/promise');
const { createLogger } = require('../../../shared/utils/logger');

const logger = createLogger('task-service:db');

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
    CREATE TABLE IF NOT EXISTS tasks (
      id          INT          AUTO_INCREMENT PRIMARY KEY,
      title       VARCHAR(255) NOT NULL,
      description TEXT,
      status      ENUM('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
      user_id     INT          NOT NULL,
      created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  logger.info('Tasks table ready');
}

module.exports = { query, initSchema };
