import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { engine } from './core/Engine';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3000;

// Initialize some default nodes for testing if the config demands it
engine.addNode({
  id: 'node-1',
  host: '10.0.0.1',
  port: 8080,
  weight: 1,
  status: 'active',
  healthScore: 100,
  activeConnections: 0,
  requestCount: 0,
  averageLatency: 0,
  failureCount: 0,
  recoveryState: false,
  lastHeartbeat: Date.now()
});

engine.addNode({
  id: 'node-2',
  host: '10.0.0.2',
  port: 8080,
  weight: 1,
  status: 'active',
  healthScore: 100,
  activeConnections: 0,
  requestCount: 0,
  averageLatency: 0,
  failureCount: 0,
  recoveryState: false,
  lastHeartbeat: Date.now()
});

engine.addNode({
  id: 'node-3',
  host: '10.0.0.3',
  port: 8080,
  weight: 1,
  status: 'active',
  healthScore: 100,
  activeConnections: 0,
  requestCount: 0,
  averageLatency: 0,
  failureCount: 0,
  recoveryState: false,
  lastHeartbeat: Date.now()
});

const server = app.listen(PORT, () => {
  logger.info(`Enterprise Load Balancer listening on port ${PORT}`);
  engine.start(); // Start the health monitor
});

// Graceful Shutdown
const shutdown = () => {
  logger.info('Shutting down gracefully...');
  engine.stop();
  server.close(() => {
    logger.info('Closed out remaining connections');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
