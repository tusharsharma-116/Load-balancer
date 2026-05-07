import { Router } from 'express';
import { LoadBalancerController } from './controllers';
import { rateLimiterMiddleware } from '../middleware/rateLimiter';

const router = Router();

// Health
router.get('/health', LoadBalancerController.getHealth);
router.get('/health/nodes', LoadBalancerController.getNodesHealth);

// Routing (Protected by rate limiter)
router.get('/route/request', rateLimiterMiddleware, LoadBalancerController.routeRequest);
router.post('/route/batch', rateLimiterMiddleware, LoadBalancerController.routeRequest); // Simplified for now

// Nodes Management
router.get('/nodes', LoadBalancerController.getNodes);
router.post('/nodes', LoadBalancerController.addNode);
router.delete('/nodes/:id', LoadBalancerController.removeNode);

// Metrics
router.get('/metrics', LoadBalancerController.getMetrics);

// Simulation
router.post('/simulate/traffic', LoadBalancerController.simulateTraffic);
router.post('/simulate/spike', LoadBalancerController.simulateSpike);
router.post('/simulate/failure', LoadBalancerController.simulateFailure);

// Configuration
router.post('/config/strategy', LoadBalancerController.setStrategy);

export { router };
