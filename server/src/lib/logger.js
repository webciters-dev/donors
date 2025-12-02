/**
 * Winston Logger Configuration
 * Provides structured logging with multiple transports and log rotation
 * 
 * Usage:
 *   import logger from './lib/logger.js';
 *   
 *   logger.info('User logged in', { userId: 123, email: 'user@example.com' });
 *   logger.error('Database error', { error: err.message, query: 'SELECT...' });
 *   logger.warn('High memory usage', { usage: '85%' });
 *   logger.debug('Debug info', { data: someObject });
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_DIR = join(__dirname, '../logs');

// Ensure logs directory exists
if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format (pretty print for development)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => {
      const { timestamp, level, message, ...meta } = info;
      const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
      return `${timestamp} [${level}]: ${message}${metaString}`;
    }
  )
);

// Define transports
const transports = [
  // Console transport (always enabled)
  new winston.transports.Console({
    format: consoleFormat,
  }),
  
  // Error log file (daily rotation)
  new DailyRotateFile({
    filename: join(LOG_DIR, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '30d',
    format,
  }),
  
  // Combined log file (daily rotation)
  new DailyRotateFile({
    filename: join(LOG_DIR, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format,
  }),
];

// Add debug log file in development
if (process.env.NODE_ENV === 'development') {
  transports.push(
    new DailyRotateFile({
      filename: join(LOG_DIR, 'debug-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'debug',
      maxSize: '20m',
      maxFiles: '7d',
      format,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create stream for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Helper methods for common logging scenarios
logger.logRequest = (req, meta = {}) => {
  logger.http('HTTP Request', {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id,
    ...meta,
  });
};

logger.logResponse = (req, res, responseTime, meta = {}) => {
  logger.http('HTTP Response', {
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userId: req.user?.id,
    ...meta,
  });
};

logger.logError = (error, context = {}) => {
  logger.error(error.message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  });
};

logger.logAuth = (event, userId, meta = {}) => {
  logger.info(`Auth: ${event}`, {
    userId,
    event,
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

logger.logDatabase = (operation, meta = {}) => {
  logger.debug(`Database: ${operation}`, {
    operation,
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

// Log startup information
logger.info('Logger initialized', {
  logLevel: level(),
  environment: process.env.NODE_ENV || 'development',
  logDirectory: LOG_DIR,
});

export default logger;
