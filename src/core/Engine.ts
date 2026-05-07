import { NodeManager } from './NodeManager';
import { HealthMonitor } from './HealthMonitor';
import { RateLimiter } from './RateLimiter';
import { StrategyManager, StrategyType } from '../strategies/StrategyManager';
import { Node, RouteDecision } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export class Engine {
  public nodeManager: NodeManager;
  public healthMonitor: HealthMonitor;
  public rateLimiter: RateLimiter;
  public strategyManager: StrategyManager;

  constructor() {
    this.nodeManager = new NodeManager();
    this.healthMonitor = new HealthMonitor(this.nodeManager, 5000);
    this.rateLimiter = new RateLimiter(100, 10); // 100 requests capacity, 10 req/s refill
    this.strategyManager = new StrategyManager('ConsistentHashing');
  }

  public start(): void {
    this.healthMonitor.start();
    logger.info('Load Balancer Engine started');
  }

  public stop(): void {
    this.healthMonitor.stop();
    logger.info('Load Balancer Engine stopped');
  }

  public addNode(node: Node): void {
    this.nodeManager.addNode(node);
    this.strategyManager.notifyNodeAdded(node);
  }

  public removeNode(nodeId: string): void {
    this.nodeManager.removeNode(nodeId);
    this.strategyManager.notifyNodeRemoved(nodeId);
  }

  public setStrategy(strategy: StrategyType): void {
    this.strategyManager.setActiveStrategy(strategy);
    logger.info({ strategy }, 'Switched load balancing strategy');
  }

  public routeRequest(clientIp: string): RouteDecision {
    const traceId = uuidv4();
    const timestamp = Date.now();
    const strategy = this.strategyManager.getActiveStrategy();
    
    // 1. Rate Limiting Check
    if (!this.rateLimiter.allowRequest(clientIp)) {
      logger.warn({ clientIp, traceId }, 'Rate limit exceeded');
      return {
        clientIp,
        timestamp,
        strategy: strategy.name,
        selectedNode: null,
        requestLatency: 0,
        traceId,
        healthSnapshot: this.nodeManager.getHealthSnapshot(),
        retryCount: 0,
        failoverStatus: false,
      };
    }

    const startRouteTime = process.hrtime.bigint();
    
    // 2. Select Node using active strategy
    let selectedNode = strategy.route(clientIp, this.nodeManager);
    let failoverStatus = false;
    let retryCount = 0;

    // 3. Fallback to Round Robin if selected node is invalid or null
    // This provides our emergency fallback
    if (!selectedNode || selectedNode.status !== 'active') {
      logger.warn({ clientIp, strategy: strategy.name, traceId }, 'Primary routing failed, falling back to Round Robin');
      failoverStatus = true;
      const roundRobin = this.strategyManager.strategies?.get('RoundRobin'); // HACK: Should use properly
      if (roundRobin) {
         selectedNode = roundRobin.route(clientIp, this.nodeManager);
         retryCount = 1;
      }
    }

    const endRouteTime = process.hrtime.bigint();
    const requestLatency = Number(endRouteTime - startRouteTime) / 1e6; // Convert to milliseconds

    // 4. Simulate sending request to node (update metrics)
    if (selectedNode) {
      // Simulate typical network latency (random between 10ms and 150ms)
      const simulatedNodeLatency = Math.floor(Math.random() * 140) + 10;
      this.nodeManager.recordRequest(selectedNode.id, simulatedNodeLatency, false);
      
      // Increment connections (simulated lifecycle would decrement it later)
      this.nodeManager.setConnectionCount(selectedNode.id, selectedNode.activeConnections + 1);
      
      // Simulate request ending after latency (decrement connection)
      setTimeout(() => {
        const node = this.nodeManager.getNode(selectedNode!.id);
        if (node && node.activeConnections > 0) {
          this.nodeManager.setConnectionCount(node.id, node.activeConnections - 1);
        }
      }, simulatedNodeLatency);
    }

    const decision: RouteDecision = {
      clientIp,
      timestamp,
      strategy: strategy.name,
      selectedNode,
      requestLatency,
      traceId,
      healthSnapshot: this.nodeManager.getHealthSnapshot(),
      retryCount,
      failoverStatus,
    };

    logger.debug({ decision }, 'Request routed');

    return decision;
  }
}

// Export a singleton instance for the app
export const engine = new Engine();
