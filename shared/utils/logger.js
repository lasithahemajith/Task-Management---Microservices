'use strict';

const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

function formatMessage(level, message, meta) {
  const ts = new Date().toISOString();
  const base = { timestamp: ts, level, message };
  if (meta && typeof meta === 'object') Object.assign(base, meta);
  return JSON.stringify(base);
}

function createLogger(service) {
  const level = (process.env.LOG_LEVEL || 'info').toLowerCase();
  const maxLevel = LOG_LEVELS[level] ?? LOG_LEVELS.info;

  function log(lvl, msg, meta) {
    if ((LOG_LEVELS[lvl] ?? 0) <= maxLevel) {
      const line = formatMessage(lvl, msg, { service, ...meta });
      if (lvl === 'error') process.stderr.write(line + '\n');
      else process.stdout.write(line + '\n');
    }
  }

  return {
    error: (msg, meta) => log('error', msg, meta),
    warn:  (msg, meta) => log('warn',  msg, meta),
    info:  (msg, meta) => log('info',  msg, meta),
    debug: (msg, meta) => log('debug', msg, meta),
  };
}

module.exports = { createLogger };
