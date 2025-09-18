import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseHealth, checkShippoHealth, logger } from '@/lib/logger';

// Health check endpoint for monitoring
export async function GET(req: NextRequest) {
  const startTime = performance.now();
  
  try {
    logger.info('Health check requested', {
      type: 'health_check',
      ip: req.ip || req.headers.get('x-forwarded-for') || 'unknown'
    });

    // Run health checks in parallel
    const [databaseHealth, shippoHealth] = await Promise.all([
      checkDatabaseHealth(),
      checkShippoHealth()
    ]);

    const totalTime = Math.round(performance.now() - startTime);
    const allHealthy = [databaseHealth, shippoHealth].every(
      check => check.status === 'healthy'
    );

    const response = {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'unknown',
      responseTime: totalTime,
      checks: {
        database: databaseHealth,
        shippo: shippoHealth
      }
    };

    // Log if any service is unhealthy
    if (!allHealthy) {
      logger.warn('Health check found unhealthy services', {
        type: 'health_check_warning',
        checks: { database: databaseHealth, shippo: shippoHealth }
      });
    }

    return NextResponse.json(response, {
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    const totalTime = Math.round(performance.now() - startTime);
    
    logger.error('Health check failed', {
      type: 'health_check_error',
      responseTime: totalTime
    }, error as Error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: totalTime,
        error: 'Health check failed'
      },
      { status: 503 }
    );
  }
}