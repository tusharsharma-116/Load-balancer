import { Engine } from '../core/Engine';
import { logger } from '../utils/logger';

export class SimulationEngine {
  private engine: Engine;
  private intervalIds: NodeJS.Timeout[] = [];

  constructor(engine: Engine) {
    this.engine = engine;
  }

  public simulateTraffic(requestsPerSecond: number, durationMs: number): void {
    logger.info(`Starting traffic simulation: ${requestsPerSecond} req/s for ${durationMs}ms`);
    const intervalMs = 1000 / requestsPerSecond;
    
    const intervalId = setInterval(() => {
      // Generate a random IP or pick from a pool
      const randomIp = `192.168.1.${Math.floor(Math.random() * 255)}`;
      this.engine.routeRequest(randomIp);
    }, intervalMs);

    this.intervalIds.push(intervalId);

    setTimeout(() => {
      clearInterval(intervalId);
      logger.info('Traffic simulation completed');
      this.intervalIds = this.intervalIds.filter(id => id !== intervalId);
    }, durationMs);
  }

  public simulateSpike(spikeRequests: number): void {
    logger.info(`Simulating traffic spike: ${spikeRequests} immediate requests`);
    for (let i = 0; i < spikeRequests; i++) {
      const randomIp = `10.0.0.${Math.floor(Math.random() * 255)}`;
      this.engine.routeRequest(randomIp);
    }
  }

  public simulateNodeFailure(nodeId: string, durationMs: number): void {
    const node = this.engine.nodeManager.getNode(nodeId);
    if (!node) {
      logger.warn(`Cannot simulate failure: Node ${nodeId} not found`);
      return;
    }

    logger.info(`Simulating node failure for ${nodeId} for ${durationMs}ms`);
    this.engine.nodeManager.updateNodeStatus(nodeId, 'dead');

    setTimeout(() => {
      const recoveredNode = this.engine.nodeManager.getNode(nodeId);
      if (recoveredNode && recoveredNode.status === 'dead') {
         logger.info(`Recovering node ${nodeId} from simulated failure`);
         this.engine.nodeManager.updateNodeStatus(nodeId, 'active');
      }
    }, durationMs);
  }

  public stopAll(): void {
    this.intervalIds.forEach(clearInterval);
    this.intervalIds = [];
    logger.info('Stopped all active simulations');
  }
}
