'use strict';

const { Kafka } = require('kafkajs');
const { createLogger } = require('../utils/logger');

const logger = createLogger('kafka-producer');

let producer = null;

async function getProducer(clientId, brokers) {
  if (producer) return producer;

  const kafka = new Kafka({
    clientId: clientId || process.env.KAFKA_CLIENT_ID || 'devtask-producer',
    brokers: brokers || (process.env.KAFKA_BROKERS || 'kafka:9092').split(','),
    retry: { retries: 5, initialRetryTime: 300 },
  });

  producer = kafka.producer();
  await producer.connect();
  logger.info('Kafka producer connected');
  return producer;
}

async function publishEvent(topic, key, value) {
  const p = await getProducer();
  const message = {
    key: String(key),
    value: JSON.stringify({ ...value, timestamp: new Date().toISOString() }),
  };
  await p.send({ topic, messages: [message] });
  logger.info('Event published', { topic, key });
}

async function disconnectProducer() {
  if (producer) {
    await producer.disconnect();
    producer = null;
    logger.info('Kafka producer disconnected');
  }
}

module.exports = { getProducer, publishEvent, disconnectProducer };
