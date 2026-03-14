'use strict';

const { Kafka } = require('kafkajs');
const { createLogger } = require('../utils/logger');

const logger = createLogger('kafka-consumer');

async function createConsumer({ clientId, groupId, brokers, topics, handler }) {
  const kafka = new Kafka({
    clientId: clientId || process.env.KAFKA_CLIENT_ID || 'devtask-consumer',
    brokers: brokers || (process.env.KAFKA_BROKERS || 'kafka:9092').split(','),
    retry: { retries: 5, initialRetryTime: 300 },
  });

  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  logger.info('Kafka consumer connected', { groupId });

  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
    logger.info('Subscribed to topic', { topic });
  }

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const value = JSON.parse(message.value.toString());
        const key = message.key ? message.key.toString() : null;
        logger.info('Event received', { topic, key });
        await handler({ topic, key, value, partition });
      } catch (err) {
        logger.error('Error processing message', { error: err.message, topic });
      }
    },
  });

  return consumer;
}

module.exports = { createConsumer };
