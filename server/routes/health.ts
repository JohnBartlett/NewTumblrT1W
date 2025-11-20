/**
 * Health Check Routes
 * For monitoring, load balancers, and deployment platforms
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * Basic health check
 * Returns 200 if server is running
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * Detailed health check
 * Includes database connectivity and system info
 */
router.get('/health/detailed', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - startTime;

    // Get database stats
    const userCount = await prisma.user.count();
    const imageCount = await prisma.storedImage.count();

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.91.0',
      database: {
        status: 'connected',
        responseTime: `${dbResponseTime}ms`,
      },
      stats: {
        users: userCount,
        storedImages: imageCount,
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        },
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * Readiness check
 * For Kubernetes/Docker health checks
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if database is ready
    await prisma.$queryRaw`SELECT 1`;
    
    // Check if environment is properly configured
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
    ];
    
    const missingVars = requiredEnvVars.filter(v => !process.env[v]);
    
    if (missingVars.length > 0) {
      return res.status(503).json({
        ready: false,
        reason: `Missing environment variables: ${missingVars.join(', ')}`,
      });
    }

    res.status(200).json({
      ready: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      reason: error instanceof Error ? error.message : 'Database not ready',
    });
  }
});

/**
 * Liveness check
 * Simple check to verify the process is alive
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
  });
});

export default router;






