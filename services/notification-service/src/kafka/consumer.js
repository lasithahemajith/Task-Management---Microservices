'use strict';

const { Kafka } = require('kafkajs');
const { query } = require('../db');
const { createLogger } = require('../../../../shared/utils/logger');

const logger = createLogger('notification-service:consumer');

const EVENT_MESSAGES = {
  TASK_CREATED:   (task) => `Task "${task.title}" has been created.`,
  TASK_UPDATED:   (task) => `Task "${task.title}" has been updated.`,
  TASK_COMPLETED: (task) => `Task "${task.title}" has been completed. 🎉`,
};

async function startConsumer() {
  const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'notification-service',
    brokers:  (process.env.KAFKA_BROKERS  || 'kafka:9092').split(','),
    retry:    { retries: 8, initialRetryTime: 500 },
  });

  const consumer = kafka.consumer({ groupId: 'notification-service-group' });

  await consumer.connect();
  logger.info('Kafka consumer connected');

  await consumer.subscribe({ topic: 'task-events', fromBeginning: false });
  logger.info('Subscribed to task-events topic');

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const payload = JSON.parse(message.value.toString());
        const { eventType, task } = payload;

        if (!task || !task.user_id) {
          logger.warn('Skipping message with missing task data');
          return;
        }

        const messageFn = EVENT_MESSAGES[eventType];
        if (!messageFn) {
          logger.warn('Unknown event type', { eventType });
          return;
        }

        const notificationMsg = messageFn(task);
        await query(
          'INSERT INTO notifications (user_id, message, event_type, task_id) VALUES (?, ?, ?, ?)',
          [task.user_id, notificationMsg, eventType, task.id],
        );

        logger.info('Notification stored', { eventType, taskId: task.id, userId: task.user_id });
      } catch (err) {
        logger.error('Failed to process event', { error: err.message });
      }
    },
  });
}

module.exports = { startConsumer };
