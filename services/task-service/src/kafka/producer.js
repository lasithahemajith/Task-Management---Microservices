'use strict';

const { Kafka } = require('kafkajs');
const { createLogger } = require('../../../../shared/utils/logger');

const logger = createLogger('task-service:kafka-producer');

let producer = null;

async function getProducer() {
  if (producer) return producer;

  const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'task-service',
    brokers:  (process.env.KAFKA_BROKERS  || 'kafka:9092').split(','),
    retry:    { retries: 5, initialRetryTime: 300 },
  });

  producer = kafka.producer();
  await producer.connect();
  logger.info('Kafka producer connected');
  return producer;
}

async function publishTaskEvent(eventType, taskData) {
  try {
    const p = await getProducer();
    await p.send({
      topic: 'task-events',
      messages: [
        {
          key: String(taskData.id),
          value: JSON.stringify({
            eventType,
            task: taskData,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });
    logger.info('Task event published', { eventType, taskId: taskData.id });
  } catch (err) {
    logger.error('Failed to publish event', { error: err.message, eventType });
  }
}

module.exports = { publishTaskEvent };
