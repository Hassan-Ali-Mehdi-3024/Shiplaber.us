// Logger utility for structured logging
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.level = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(context && { context }),
      ...(error && { 
        error: {
          name: error.name,
          message: error.message,
          stack: this.isDevelopment ? error.stack : undefined,
        }
      }),
    };

    return this.isDevelopment 
      ? JSON.stringify(logEntry, null, 2)
      : JSON.stringify(logEntry);
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message, context));
    }
  }

  warn(message: string, context?: LogContext, error?: Error) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context, error));
    }
  }

  error(message: string, context?: LogContext, error?: Error) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message, context, error));
    }
  }

  // Specific logging methods for common scenarios
  authFailure(message: string, email?: string, ip?: string) {
    this.warn('Authentication failure', { 
      type: 'auth_failure',
      email: email ? this.maskEmail(email) : undefined,
      ip,
      message
    });
  }

  apiRequest(method: string, path: string, userId?: string, ip?: string, responseTime?: number) {
    this.info('API request', {
      type: 'api_request',
      method,
      path,
      userId,
      ip,
      responseTime
    });
  }

  databaseError(operation: string, error: Error, context?: LogContext) {
    this.error(`Database operation failed: ${operation}`, {
      type: 'database_error',
      operation,
      ...context
    }, error);
  }

  shippoError(operation: string, error: Error, context?: LogContext) {
    this.error(`Shippo API error: ${operation}`, {
      type: 'shippo_error',
      operation,
      ...context
    }, error);
  }

  creditOperation(type: string, userId: string, amount: number, performedBy: string) {
    this.info(`Credit operation: ${type}`, {
      type: 'credit_operation',
      operation: type,
      userId,
      amount,
      performedBy
    });
  }

  labelPurchase(userId: string, cost: number, carrier: string, trackingNumber?: string) {
    this.info('Label purchased', {
      type: 'label_purchase',
      userId,
      cost,
      carrier,
      trackingNumber
    });
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return email;
    return `${local.charAt(0)}***${local.slice(-1)}@${domain}`;
  }
}

export const logger = new Logger();

// Request ID middleware for tracing
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Performance monitoring
export class PerformanceMonitor {
  private static timers = new Map<string, number>();

  static start(label: string): void {
    this.timers.set(label, performance.now());
  }

  static end(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      logger.warn('Performance timer not found', { label });
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(label);
    
    logger.debug('Performance measurement', {
      type: 'performance',
      label,
      duration: `${duration.toFixed(2)}ms`
    });

    return duration;
  }
}

// Health check utilities
export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  responseTime?: number;
}

export async function checkDatabaseHealth(): Promise<HealthCheck> {
  try {
    const start = performance.now();
    // Simple query to check database connectivity
    await import('@/lib/db/prisma').then(({ prisma }) => 
      prisma.$queryRaw`SELECT 1`
    );
    const responseTime = performance.now() - start;

    return {
      name: 'database',
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime: Math.round(responseTime)
    };
  } catch (error) {
    logger.error('Database health check failed', {}, error as Error);
    return {
      name: 'database',
      status: 'unhealthy',
      message: 'Database connection failed'
    };
  }
}

export async function checkShippoHealth(): Promise<HealthCheck> {
  try {
    const start = performance.now();
    const response = await fetch('https://api.goshippo.com/v1/', {
      method: 'GET',
      headers: {
        'Authorization': `ShippoToken ${process.env.SHIPPO_API_KEY}`,
      },
    });
    const responseTime = performance.now() - start;

    return {
      name: 'shippo',
      status: response.ok ? 'healthy' : 'unhealthy',
      responseTime: Math.round(responseTime),
      message: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    logger.error('Shippo health check failed', {}, error as Error);
    return {
      name: 'shippo',
      status: 'unhealthy',
      message: 'Shippo API unreachable'
    };
  }
}

// Error classification
export function classifyError(error: any): {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  shouldAlert: boolean;
} {
  // Database errors
  if (error.code?.startsWith('P')) {
    return {
      type: 'database',
      severity: 'high',
      shouldAlert: true
    };
  }

  // Authentication errors
  if (error.message?.includes('Unauthorized') || error.message?.includes('token')) {
    return {
      type: 'authentication',
      severity: 'medium',
      shouldAlert: false
    };
  }

  // Validation errors
  if (error.name === 'ZodError' || error.message?.includes('validation')) {
    return {
      type: 'validation',
      severity: 'low',
      shouldAlert: false
    };
  }

  // Shippo API errors
  if (error.message?.includes('GoShippo') || error.message?.includes('Shippo')) {
    return {
      type: 'external_api',
      severity: 'medium',
      shouldAlert: true
    };
  }

  // Default classification
  return {
    type: 'unknown',
    severity: 'medium',
    shouldAlert: true
  };
}