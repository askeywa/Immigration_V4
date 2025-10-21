import mongoose from 'mongoose';
import { config } from './env.config';
import logger from '../utils/logger';
import { SubscriptionPlanIndexMigration } from '../utils/migrations/subscription-plan-index-migration';

/**
 * Connect to MongoDB
 * Robust connection with retries and proper error handling
 */
export const connectDatabase = async (): Promise<void> => {
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info('Attempting to connect to MongoDB', {
        attempt,
        maxRetries,
        database: config.MONGO_URI.split('/').pop()?.split('?')[0]
      });

      await mongoose.connect(config.MONGO_URI, {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
      });

      logger.info('MongoDB connected successfully', {
        host: mongoose.connection.host,
        database: mongoose.connection.name,
      });

      // Setup connection event handlers
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error', { error: error.message });
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      // Run database migrations after successful connection
      await runMigrations();

      return; // Success, exit retry loop

    } catch (error) {
      logger.error(`MongoDB connection attempt ${attempt}/${maxRetries} failed`, {
        error: error instanceof Error ? error.message : String(error),
      });

      if (attempt === maxRetries) {
        throw new Error(`MongoDB connection failed after ${maxRetries} attempts`);
      }

      logger.info(`Retrying MongoDB connection in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Check if database is connected
 */
export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

/**
 * Run database migrations
 * Executes all necessary database migrations after connection
 */
const runMigrations = async (): Promise<void> => {
  try {
    logger.info('Running database migrations...');
    
    // Run subscription plan index migration
    await SubscriptionPlanIndexMigration.run();
    
    logger.info('Database migrations completed successfully');
  } catch (error) {
    logger.error('Database migrations failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    // Don't throw - allow app to start even if migrations fail
  }
};

