/**
 * Subscription Plan Custom Error Classes
 * Provides type-safe error handling with proper HTTP status codes
 * 
 * Following CORE-CRITICAL Rules:
 * - Rule 9: TypeScript strict (no 'any')
 * - Better error handling with custom error types
 */

/**
 * Base Subscription Plan Error
 */
export class SubscriptionPlanError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Plan Already Exists Error (409 Conflict)
 */
export class PlanAlreadyExistsError extends SubscriptionPlanError {
  constructor(slug: string) {
    super(
      `Subscription plan with slug '${slug}' already exists`,
      409,
      'PLAN_EXISTS'
    );
  }
}

/**
 * Plan Not Found Error (404 Not Found)
 */
export class PlanNotFoundError extends SubscriptionPlanError {
  constructor(planId: string) {
    super(
      `Subscription plan with ID '${planId}' not found`,
      404,
      'PLAN_NOT_FOUND'
    );
  }
}

/**
 * Plan In Use Error (400 Bad Request)
 */
export class PlanInUseError extends SubscriptionPlanError {
  constructor(tenantCount: number) {
    super(
      `Cannot delete plan with active tenants. ${tenantCount} tenant(s) are currently using this plan`,
      400,
      'PLAN_IN_USE'
    );
  }
}

/**
 * Unauthorized Error (403 Forbidden)
 */
export class UnauthorizedPlanOperationError extends SubscriptionPlanError {
  constructor(operation: string) {
    super(
      `Only super admins can ${operation} subscription plans`,
      403,
      'UNAUTHORIZED'
    );
  }
}

/**
 * Invalid Plan Data Error (400 Bad Request)
 */
export class InvalidPlanDataError extends SubscriptionPlanError {
  constructor(message: string) {
    super(
      message,
      400,
      'INVALID_PLAN_DATA'
    );
  }
}

