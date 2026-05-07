import { NodeManager } from '../core/NodeManager';
import { logger } from '../utils/logger';

export class HealthMonitor {
  private nodeManager: NodeManager;
  private checkIntervalMs: number;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(nodeManager: NodeManager, checkIntervalMs: number = 5000) {
    this.nodeManager = nodeManager;
    this.checkIntervalMs = checkIntervalMs;
  }

  public start(): void {
    if (this.intervalId) return;
    
    this.intervalId = setInterval(() => {
      this.checkNodes();
    }, this.checkIntervalMs);
    
    logger.info('Health monitor started');
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Health monitor stopped');
    }
  }

  private checkNodes(): void {
    const nodes = this.nodeManager.getAllNodes();
    
    for (const node of nodes) {
      if (node.status === 'dead') {
        // Simulated attempt to revive node
        if (Math.random() > 0.8) { // 20% chance to recover a dead node in simulation
          node.healthScore = 50;
          node.recoveryState = true;
          this.nodeManager.updateNodeStatus(node.id, 'draining');
          logger.info({ nodeId: node.id }, 'Node is recovering, moving to draining state');
        }
        continue;
      }

      // Simulate a health check ping
      const pingSuccessful = Math.random() > 0.05; // 5% chance of network glitch

      if (!pingSuccessful) {
        this.nodeManager.recordRequest(node.id, 5000, true);
      } else {
        if (node.status === 'draining' && node.healthScore > 80) {
          node.recoveryState = false;
          this.nodeManager.updateNodeStatus(node.id, 'active');
          logger.info({ nodeId: node.id }, 'Node fully recovered, marked as active');
        }
        
        // Slightly improve health on successful background ping
        node.healthScore = Math.min(100, node.healthScore + 2);
      }
    }
  }
}
