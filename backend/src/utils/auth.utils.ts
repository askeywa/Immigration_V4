import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/env.config';

/**
 * Password utilities
 */
export class PasswordUtils {
  /**
   * Hash a password
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = config.BCRYPT_SALT_ROUNDS;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate a random password
   */
  static generateRandomPassword(length = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }
}

/**
 * JWT utilities
 */
export class JWTUtils {
  /**
   * Generate access token
   */
  static generateAccessToken(payload: {
    userId: string;
    userType: string;
    tenantId?: string;
    email: string;
    permissions: string[];
  }): string {
    const tokenPayload = {
      userId: payload.userId,
      userType: payload.userType,
      email: payload.email,
      permissions: payload.permissions,
      ...(payload.tenantId && { tenantId: payload.tenantId })
    };

    return jwt.sign(tokenPayload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRE,
      issuer: 'canadian-immigration-portal',
      audience: 'canadian-immigration-portal'
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: {
    userId: string;
    userType: string;
    tenantId?: string;
    email: string;
    permissions: string[];
  }): string {
    const tokenPayload = {
      userId: payload.userId,
      userType: payload.userType,
      email: payload.email,
      permissions: payload.permissions,
      type: 'refresh',
      ...(payload.tenantId && { tenantId: payload.tenantId })
    };

    return jwt.sign(tokenPayload, config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRE,
      issuer: 'canadian-immigration-portal',
      audience: 'canadian-immigration-portal'
    } as jwt.SignOptions);
  }

  /**
   * Generate both access and refresh tokens
   */
  static generateTokens(payload: {
    userId: string;
    userType: string;
    tenantId?: string;
    email: string;
    permissions: string[];
  }): { accessToken: string; refreshToken: string } {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return { accessToken, refreshToken };
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): jwt.JwtPayload {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET, {
        issuer: 'canadian-immigration-portal',
        audience: 'canadian-immigration-portal'
      });
      
      // Verify it's a JwtPayload object, not a string
      if (typeof decoded === 'string') {
        throw new Error('Invalid token format');
      }
      
      return decoded as jwt.JwtPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): jwt.JwtPayload {
    try {
      const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET, {
        issuer: 'canadian-immigration-portal',
        audience: 'canadian-immigration-portal'
      });
      
      // Verify it's a JwtPayload object, not a string
      if (typeof decoded === 'string') {
        throw new Error('Invalid token format');
      }
      
      return decoded as jwt.JwtPayload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decodeToken(token: string): jwt.JwtPayload | null {
    const decoded = jwt.decode(token);
    if (typeof decoded === 'string') {
      return null;
    }
    return decoded;
  }
}

/**
 * Token utilities for email verification and password reset
 */
export class TokenUtils {
  /**
   * Generate random token
   */
  static generateRandomToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate email verification token
   */
  static generateEmailVerificationToken(): string {
    return this.generateRandomToken(32);
  }

  /**
   * Generate password reset token
   */
  static generatePasswordResetToken(): string {
    return this.generateRandomToken(32);
  }

  /**
   * Generate MFA backup codes
   */
  static generateMfaBackupCodes(count = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }
}

/**
 * Session utilities
 */
export class SessionUtils {
  /**
   * Generate session ID
   */
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Calculate session expiry
   */
  static calculateSessionExpiry(): Date {
    const expiryMs = config.SESSION_EXPIRE;
    return new Date(Date.now() + expiryMs);
  }
}

/**
 * Security utilities
 */
export class SecurityUtils {
  /**
   * Sanitize user input - BASIC sanitization
   * Note: This is NOT comprehensive XSS protection
   * Frontend should also sanitize when displaying
   * 
   * For comprehensive protection:
   * - Backend: Remove dangerous patterns
   * - Frontend: Use DOMPurify when displaying
   * - Database: Store sanitized data
   */
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>'"]/g, '') // Remove HTML special chars
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers (onclick=, onerror=, etc.)
      .replace(/&lt;|&gt;|&#60;|&#62;/gi, '') // Remove encoded brackets
      .replace(/\\u003c|\\u003e/gi, '') // Remove unicode encoded
      .slice(0, 500); // Limit length to prevent DoS
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate secure random string
   */
  static generateSecureRandom(length = 16): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash sensitive data (for audit logs)
   */
  static hashSensitiveData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
