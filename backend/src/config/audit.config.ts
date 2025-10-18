/**
 * Audit System Configuration
 * Centralized configuration for audit logging with environment variable support
 */

const parseEnvInt = (envVar: string | undefined, defaultValue: number): number => {
  if (!envVar) return defaultValue;
  const parsed = parseInt(envVar, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const AUDIT_CONFIG = {
  // Data size limits (configurable via environment)
  // SECURITY: Increased to 50KB to cover 99% of cases without truncation
  MAX_REQUEST_BODY_SIZE: parseEnvInt(process.env.AUDIT_MAX_BODY_SIZE, 50 * 1024), // 50KB default
  MAX_RESPONSE_DATA_SIZE: parseEnvInt(process.env.AUDIT_MAX_RESPONSE_SIZE, 50 * 1024), // 50KB default
  
  // Query limits
  MAX_LIMIT: 1000,
  DEFAULT_LIMIT: 50,
  
  // Retention (configurable via environment)
  // COMPLIANCE: Default to 7 years (2555 days) to meet enterprise requirements (HIPAA, SOC 2, etc.)
  // Override via AUDIT_RETENTION_DAYS environment variable if needed
  DEFAULT_RETENTION_DAYS: parseEnvInt(process.env.AUDIT_RETENTION_DAYS, 2555), // 7 years default
  
  // Rate limiting
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 5,
  
  // Failure thresholds (configurable via environment)
  ALERT_THRESHOLD: parseEnvInt(process.env.AUDIT_ALERT_THRESHOLD, 10),
  ALERT_WINDOW: 5 * 60 * 1000, // 5 minutes
  
  // Performance
  DB_OPERATION_TIMEOUT: parseEnvInt(process.env.AUDIT_DB_TIMEOUT, 3000), // 3 seconds default
  BATCH_SIZE: 100,
  FLUSH_INTERVAL: 5000, // 5 seconds
  
  // Sensitive fields to redact
  SENSITIVE_FIELDS: [
    'password', 'token', 'secret', 'apiKey', 'creditCard',
    'ssn', 'sin', 'passport', 'dateOfBirth', 'dob',
    'phoneNumber', 'phone', 'address', 'bankAccount',
    'accessToken', 'refreshToken', 'authorization',
    'cvv', 'securityCode', 'pin', 'privateKey',
    'sessionId', 'cookie', 'bearer'
  ],
  
  /**
   * Validate configuration on startup
   */
  validate(): void {
    // Validate body size (1KB to 10MB)
    if (this.MAX_REQUEST_BODY_SIZE < 1024 || this.MAX_REQUEST_BODY_SIZE > 10485760) {
      throw new Error('AUDIT_MAX_BODY_SIZE must be between 1KB (1024) and 10MB (10485760)');
    }
    
    // Validate retention days (30 days to 10 years)
    if (this.DEFAULT_RETENTION_DAYS < 30 || this.DEFAULT_RETENTION_DAYS > 3650) {
      throw new Error('AUDIT_RETENTION_DAYS must be between 30 and 3650 days');
    }
    
    // Validate alert threshold (1 to 100)
    if (this.ALERT_THRESHOLD < 1 || this.ALERT_THRESHOLD > 100) {
      throw new Error('AUDIT_ALERT_THRESHOLD must be between 1 and 100');
    }
    
    // Validate DB timeout (500ms to 30s)
    if (this.DB_OPERATION_TIMEOUT < 500 || this.DB_OPERATION_TIMEOUT > 30000) {
      throw new Error('AUDIT_DB_TIMEOUT must be between 500 and 30000 milliseconds');
    }
  }
} as const;

// Validate configuration on module load
try {
  AUDIT_CONFIG.validate();
} catch (error) {
  console.error('❌ Audit configuration validation failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}

