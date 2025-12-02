/**
 * Health Check Module
 * Provides basic health monitoring endpoints and status tracking
 * 
 * Usage:
 *   import { setupHealthCheck, getSystemHealth } from './monitoring/healthCheck.js';
 *   
 *   // In server.js
 *   setupHealthCheck(app);
 *   
 *   // Check health programmatically
 *   const health = await getSystemHealth();
 */

import prisma from '../prismaClient.js';
import os from 'os';

/**
 * Check database connection health
 */
async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      responseTime: Date.now(),
      message: 'Database connection successful'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now(),
      message: 'Database connection failed',
      error: error.message
    };
  }
}

/**
 * Check system resources
 */
function checkSystemResources() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(2);
  
  const cpuLoad = os.loadavg()[0]; // 1-minute load average
  const cpuCount = os.cpus().length;
  const cpuUsagePercent = ((cpuLoad / cpuCount) * 100).toFixed(2);
  
  return {
    status: memoryUsagePercent > 90 || cpuUsagePercent > 90 ? 'warning' : 'healthy',
    memory: {
      total: `${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
      used: `${(usedMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
      free: `${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
      usagePercent: `${memoryUsagePercent}%`
    },
    cpu: {
      cores: cpuCount,
      loadAverage: cpuLoad.toFixed(2),
      usagePercent: `${cpuUsagePercent}%`
    },
    uptime: {
      system: `${(os.uptime() / 3600).toFixed(2)} hours`,
      process: `${(process.uptime() / 3600).toFixed(2)} hours`
    }
  };
}

/**
 * Get comprehensive system health status
 */
export async function getSystemHealth() {
  const startTime = Date.now();
  
  const [database, resources] = await Promise.all([
    checkDatabase(),
    Promise.resolve(checkSystemResources())
  ]);
  
  const overallStatus = database.status === 'unhealthy' ? 'unhealthy' :
                       resources.status === 'warning' ? 'warning' : 'healthy';
  
  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    responseTime: `${Date.now() - startTime}ms`,
    checks: {
      database,
      resources
    },
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || 'unknown'
  };
}

/**
 * Setup health check endpoint
 * @param {Express.Application} app - Express app instance
 */
export function setupHealthCheck(app) {
  // Basic health check endpoint
  app.get('/health', async (req, res) => {
    try {
      const health = await getSystemHealth();
      const statusCode = health.status === 'healthy' ? 200 :
                        health.status === 'warning' ? 200 : 503;
      
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });
  
  // Simple ping endpoint (no database check)
  app.get('/ping', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Server is running'
    });
  });
  
  // Detailed readiness check (for load balancers)
  app.get('/ready', async (req, res) => {
    try {
      const dbCheck = await checkDatabase();
      
      if (dbCheck.status === 'healthy') {
        res.status(200).json({
          status: 'ready',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          status: 'not-ready',
          timestamp: new Date().toISOString(),
          reason: 'Database not available'
        });
      }
    } catch (error) {
      res.status(503).json({
        status: 'not-ready',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });
  
  console.log(' Health check endpoints registered:');
  console.log('   GET /health - Comprehensive health check');
  console.log('   GET /ping - Simple ping check');
  console.log('   GET /ready - Readiness check for load balancers');
}

export default { setupHealthCheck, getSystemHealth };
