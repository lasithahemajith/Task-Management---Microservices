'use strict';

module.exports = {
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'devtask-service',
  },
  mysql: {
    host:     process.env.MYSQL_HOST     || 'localhost',
    port:     parseInt(process.env.MYSQL_PORT || '3306', 10),
    user:     process.env.MYSQL_USER     || 'devtask',
    password: process.env.MYSQL_PASSWORD || 'devtask_password',
    database: process.env.MYSQL_DATABASE || 'devtask_db',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  jwt: {
    secret:     process.env.JWT_SECRET     || 'change_this_secret',
    expiresIn:  process.env.JWT_EXPIRES_IN || '24h',
  },
  services: {
    authServiceUrl:         process.env.AUTH_SERVICE_URL         || 'http://localhost:3001',
    taskServiceUrl:         process.env.TASK_SERVICE_URL         || 'http://localhost:3002',
    notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003',
  },
};
