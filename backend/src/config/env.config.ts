import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  API_VERSION: string;
  MONGO_URI: string;
  MONGO_POOL_SIZE: number;
  MONGO_MAX_IDLE_TIME: number;
  REDIS_URL: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  REDIS_TTL: number;
  JWT_SECRET: string;
  JWT_EXPIRE: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRE: string;
  SESSION_SECRET: string;
  SESSION_EXPIRE: number;
  CORS_ORIGIN: string;
  ALLOWED_DOMAINS: string[];
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  RATE_LIMIT_AUTH_MAX: number;
  BCRYPT_SALT_ROUNDS: number;
  MFA_ISSUER: string;
  MFA_WINDOW: number;
  SENTRY_DSN?: string;
  SENTRY_ENVIRONMENT: string;
  LOG_LEVEL: string;
  LOG_MAX_SIZE: string;
  LOG_MAX_FILES: number;
  REQUIRE_AUDIT_QUEUE: string;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const getEnvNumber = (key: string, defaultValue?: number): number => {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ? parseInt(value, 10) : defaultValue!;
};

export const config: EnvConfig = {
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  PORT: getEnvNumber('PORT', 5000),
  API_VERSION: getEnvVar('API_VERSION', 'v1'),
  
  // Database
  MONGO_URI: getEnvVar('MONGODB_URI'), // Using existing variable name from previous project
  MONGO_POOL_SIZE: getEnvNumber('MONGO_POOL_SIZE', 10),
  MONGO_MAX_IDLE_TIME: getEnvNumber('MONGO_MAX_IDLE_TIME', 10000),
  
  // Redis - Parse from REDIS_URL
  REDIS_URL: getEnvVar('REDIS_URL', 'redis://localhost:6379'),
  REDIS_HOST: (() => {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      const url = new URL(redisUrl);
      return url.hostname;
    } catch {
      return 'localhost';
    }
  })(),
  REDIS_PORT: (() => {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      const url = new URL(redisUrl);
      return parseInt(url.port || '6379', 10);
    } catch {
      return 6379;
    }
  })(),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_TTL: getEnvNumber('REDIS_TTL', 3600),
  
  // JWT
  JWT_SECRET: getEnvVar('JWT_SECRET'),
  JWT_EXPIRE: getEnvVar('JWT_EXPIRE', '7d'),
  JWT_REFRESH_SECRET: getEnvVar('JWT_REFRESH_SECRET'),
  JWT_REFRESH_EXPIRE: getEnvVar('JWT_REFRESH_EXPIRE', '30d'),
  
  // Session
  SESSION_SECRET: getEnvVar('SESSION_SECRET'),
  SESSION_EXPIRE: getEnvNumber('SESSION_EXPIRE', 86400000),
  
  // CORS
  CORS_ORIGIN: getEnvVar('CORS_ORIGIN', 'http://localhost:5173'),
  ALLOWED_DOMAINS: getEnvVar('ALLOWED_DOMAINS', 'localhost:5173').split(','),
  
  // Rate Limiting (Increased for Development)
  RATE_LIMIT_WINDOW_MS: getEnvNumber('RATE_LIMIT_WINDOW_MS', 900000),
  RATE_LIMIT_MAX_REQUESTS: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 200),
  RATE_LIMIT_AUTH_MAX: getEnvNumber('RATE_LIMIT_AUTH_MAX', 10),
  
  // Security
  BCRYPT_SALT_ROUNDS: getEnvNumber('BCRYPT_SALT_ROUNDS', 12),
  
  // MFA
  MFA_ISSUER: getEnvVar('MFA_ISSUER', 'Canadian Immigration Portal'),
  MFA_WINDOW: getEnvNumber('MFA_WINDOW', 2),
  
  // Monitoring
  SENTRY_DSN: process.env.SENTRY_DSN,
  SENTRY_ENVIRONMENT: getEnvVar('SENTRY_ENVIRONMENT', 'development'),
  
  // Logging
  LOG_LEVEL: getEnvVar('LOG_LEVEL', 'debug'),
  LOG_MAX_SIZE: getEnvVar('LOG_MAX_SIZE', '5m'),
  LOG_MAX_FILES: getEnvNumber('LOG_MAX_FILES', 5),
  
  // Audit Queue Requirement
  // Set to 'true' in production to enforce Redis-backed audit queue
  // Set to 'false' in development to allow in-memory fallback
  REQUIRE_AUDIT_QUEUE: getEnvVar('REQUIRE_AUDIT_QUEUE', 'false'),
};

export const isProduction = config.NODE_ENV === 'production';
export const isDevelopment = config.NODE_ENV === 'development';
export const isTest = config.NODE_ENV === 'test';

