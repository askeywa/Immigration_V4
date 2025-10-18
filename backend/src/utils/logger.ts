import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config, isDevelopment } from '../config/env.config';

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

// Custom format for console output in development
const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  let metaStr = '';
  if (Object.keys(meta).length > 0) {
    metaStr = `\n${JSON.stringify(meta, null, 2)}`;
  }
  return `${timestamp} [${level}]: ${message}${metaStr}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: 'canadian-immigration-backend' },
  transports: [
    // Error log file - only errors
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: config.LOG_MAX_SIZE,
      maxFiles: config.LOG_MAX_FILES,
      format: combine(
        timestamp(),
        json()
      ),
    }),
    
    // Combined log file - all logs
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: config.LOG_MAX_SIZE,
      maxFiles: config.LOG_MAX_FILES,
      format: combine(
        timestamp(),
        json()
      ),
    }),
  ],
});

// Add console transport only in development
if (isDevelopment) {
  logger.add(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        devFormat
      ),
    })
  );
}

export default logger;

