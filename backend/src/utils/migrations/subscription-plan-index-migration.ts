/**
 * Subscription Plan Index Migration
 * Automatically migrates from old unique slug index to composite sparse index
 * 
 * This migration runs once on application startup and removes the old
 * { slug: 1 } unique index that doesn't respect soft deletes.
 * 
 * The new index { slug: 1, deletedAt: 1 } with partialFilterExpression
 * allows slug reuse after soft delete while maintaining uniqueness for active plans.
 */

import mongoose from 'mongoose';
import logger from '../logger';

export class SubscriptionPlanIndexMigration {
  private static migrationCompleted = false;

  /**
   * Run index migration once
   * Safe to call multiple times - only executes once per app lifecycle
   */
  static async run(): Promise<void> {
    // Skip if already run in this app lifecycle
    if (this.migrationCompleted) {
      return;
    }

    try {
      const SubscriptionPlan = mongoose.model('SubscriptionPlan');
      const collection = SubscriptionPlan.collection;

      // Get existing indexes
      const indexes = await collection.indexes();
      
      // Check if old unique slug index exists
      const oldSlugIndex = indexes.find(
        (idx: any) => 
          idx.key.slug === 1 && 
          idx.key.deletedAt === undefined &&
          idx.unique === true
      );

      if (oldSlugIndex) {
        logger.info('Subscription plan index migration: Removing old slug_1 unique index');
        
        // Drop the old index
        await collection.dropIndex(oldSlugIndex.name);
        
        logger.info('Subscription plan index migration: Old index removed successfully');
        logger.info('Subscription plan index migration: New composite index will be created automatically');
      } else {
        logger.info('Subscription plan index migration: No old index found, skipping migration');
      }

      // Mark migration as completed
      this.migrationCompleted = true;
      
    } catch (error) {
      // Log error but don't crash the application
      logger.error('Subscription plan index migration failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        note: 'Application will continue, but slug uniqueness may not work correctly until migration is completed manually'
      });
      
      // Mark as completed to prevent retry loops
      this.migrationCompleted = true;
    }
  }

  /**
   * Reset migration flag (for testing purposes only)
   * @internal
   */
  static resetForTesting(): void {
    this.migrationCompleted = false;
  }
}

