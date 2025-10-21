/**
 * Validation Utilities
 * Centralized validation and sanitization helpers
 * 
 * SECURITY: Use these utilities for ALL user input validation
 */

import mongoose from 'mongoose';
import validator from 'validator';

export class ValidationUtils {
  /**
   * Validate and sanitize MongoDB ObjectId
   * @throws Error if invalid
   */
  static validateObjectId(id: any, fieldName = 'ID'): string {
    if (!id) {
      throw new Error(`${fieldName} is required`);
    }
    
    if (typeof id !== 'string') {
      throw new Error(`${fieldName} must be a string`);
    }
    
    const trimmed = id.trim();
    
    if (trimmed.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(trimmed)) {
      throw new Error(`Invalid ${fieldName} format`);
    }
    
    if (!mongoose.Types.ObjectId.isValid(trimmed)) {
      throw new Error(`Invalid ${fieldName} format`);
    }
    
    return trimmed;
  }

  /**
   * Validate and sanitize email address
   * @throws Error if invalid
   */
  static validateEmail(email: any): string {
    if (!email) {
      throw new Error('Email is required');
    }
    
    if (typeof email !== 'string') {
      throw new Error('Email must be a string');
    }
    
    const trimmed = email.trim().toLowerCase();
    
    if (trimmed.length > 255) {
      throw new Error('Email exceeds maximum length of 255 characters');
    }
    
    if (!validator.isEmail(trimmed)) {
      throw new Error('Invalid email format');
    }
    
    return trimmed;
  }

  /**
   * Sanitize string input (removes HTML, limits length)
   * @throws Error if invalid
   */
  static sanitizeString(input: any, maxLength = 1000, fieldName = 'Input'): string {
    if (input === null || input === undefined) {
      return '';
    }
    
    if (typeof input !== 'string') {
      throw new Error(`${fieldName} must be a string`);
    }
    
    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    // Check length
    if (sanitized.length > maxLength) {
      throw new Error(`${fieldName} exceeds maximum length of ${maxLength} characters`);
    }
    
    // Escape HTML to prevent XSS
    sanitized = validator.escape(sanitized);
    
    return sanitized;
  }

  /**
   * Validate and sanitize URL using native URL constructor (secure)
   * @throws Error if invalid
   */
  static validateURL(url: any): string {
    if (!url || typeof url !== 'string') {
      throw new Error('URL must be a string');
    }
    
    const trimmed = url.trim();
    
    try {
      const urlObj = new URL(trimmed);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('URL must use http or https protocol');
      }
      
      // Additional security checks
      if (urlObj.hostname.length > 253) {
        throw new Error('URL hostname too long');
      }
      
      // Check for suspicious patterns
      if (urlObj.hostname.includes('..') || urlObj.hostname.startsWith('.')) {
        throw new Error('Invalid URL hostname');
      }
      
      return trimmed;
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }

  /**
   * Safe MongoDB query helper - forces exact match
   */
  static safeMongoQuery<T>(value: T): { $eq: T } {
    return { $eq: value };
  }

  /**
   * Validate numeric input with range
   * @throws Error if invalid
   */
  static validateNumber(
    value: any, 
    min?: number, 
    max?: number, 
    fieldName = 'Number'
  ): number {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(num) || typeof num !== 'number') {
      throw new Error(`${fieldName} must be a valid number`);
    }
    
    if (min !== undefined && num < min) {
      throw new Error(`${fieldName} must be at least ${min}`);
    }
    
    if (max !== undefined && num > max) {
      throw new Error(`${fieldName} must be at most ${max}`);
    }
    
    return num;
  }

  /**
   * Validate enum value
   * @throws Error if invalid
   */
  static validateEnum<T extends string>(
    value: any,
    allowedValues: readonly T[],
    fieldName = 'Value'
  ): T {
    if (!value || typeof value !== 'string') {
      throw new Error(`${fieldName} must be a string`);
    }
    
    if (!allowedValues.includes(value as T)) {
      throw new Error(
        `${fieldName} must be one of: ${allowedValues.join(', ')}`
      );
    }
    
    return value as T;
  }

  /**
   * Sanitize object (recursive, with depth limit)
   * @throws Error if depth exceeded or invalid
   */
  static sanitizeObject(obj: any, depth = 0, maxDepth = 10): any {
    if (depth > maxDepth) {
      throw new Error('Object nesting too deep');
    }
    
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      if (obj.length > 1000) {
        throw new Error('Array too large (max 1000 items)');
      }
      return obj.map(item => this.sanitizeObject(item, depth + 1, maxDepth));
    }
    
    const sanitized: any = {};
    let keyCount = 0;
    
    for (const [key, value] of Object.entries(obj)) {
      keyCount++;
      if (keyCount > 100) {
        throw new Error('Too many object keys (max 100)');
      }
      
      const sanitizedKey = this.sanitizeString(key, 100, 'Object key');
      sanitized[sanitizedKey] = this.sanitizeObject(value, depth + 1, maxDepth);
    }
    
    return sanitized;
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(query: any): { page: number; limit: number; skip: number } {
    const page = Math.max(parseInt(query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit) || 50, 1), 1000);
    const skip = (page - 1) * limit;
    
    return { page, limit, skip };
  }

  /**
   * Validate date range
   */
  static validateDateRange(startDate?: any, endDate?: any): { 
    startDate?: Date; 
    endDate?: Date;
  } {
    const result: { startDate?: Date; endDate?: Date } = {};
    
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        throw new Error('Invalid start date');
      }
      result.startDate = start;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        throw new Error('Invalid end date');
      }
      result.endDate = end;
    }
    
    if (result.startDate && result.endDate && result.startDate > result.endDate) {
      throw new Error('Start date must be before end date');
    }
    
    return result;
  }
}

