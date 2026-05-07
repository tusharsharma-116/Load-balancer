import { Node, NodeStatus } from '../types';
import { logger } from '../utils/logger';

export class NodeManager {
  private nodes: Map<string, Node> = new Map();

  public addNode(node: Node): void {
    if (this.nodes.has(node.id)) {
      throw new Error(`Node ${node.id} already exists`);
    }
    this.nodes.set(node.id, { ...node, lastHeartbeat: Date.now() });
    logger.info({ nodeId: node.id }, 'Node registered');
  }

  public removeNode(nodeId: string): void {
    if (this.nodes.delete(nodeId)) {
      logger.info({ nodeId }, 'Node removed');
    }
  }

  public getNode(nodeId: string): Node | undefined {
    return this.nodes.get(nodeId);
  }

  public updateNodeStatus(nodeId: string, status: NodeStatus): void {
    const node = this.nodes.get(nodeId);
    if (node && node.status !== status) {
      node.status = status;
      logger.info({ nodeId, status }, 'Node status changed');
    }
  }

  public getAllNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  public getActiveNodes(): Node[] {
    return this.getAllNodes().filter(
      (node) => node.status === 'active' && node.healthScore > 0
    );
  }

  public recordRequest(nodeId: string, latencyMs: number, isError: boolean): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    node.requestCount += 1;
    
    // Moving average for latency
    node.averageLatency = 
      (node.averageLatency * 0.9) + (latencyMs * 0.1);

    if (isError) {
      node.failureCount += 1;
      this.penalizeHealth(node);
    } else {
      // Gradual recovery of health
      node.healthScore = Math.min(100, node.healthScore + 0.1);
    }
  }

  public setConnectionCount(nodeId: string, activeConnections: number): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.activeConnections = activeConnections;
    }
  }

  private penalizeHealth(node: Node): void {
    // Drop health score significantly on error
    node.healthScore = Math.max(0, node.healthScore - 10);
    
    if (node.healthScore < 50 && node.status === 'active') {
      logger.warn({ nodeId: node.id }, 'Node health critical, marking as draining');
      node.status = 'draining';
    } else if (node.healthScore === 0 && node.status !== 'dead') {
      logger.error({ nodeId: node.id }, 'Node dead, removing from active pool');
      node.status = 'dead';
    }
  }

  public getHealthSnapshot(): Record<string, NodeStatus> {
    const snapshot: Record<string, NodeStatus> = {};
    for (const [id, node] of this.nodes.entries()) {
      snapshot[id] = node.status;
    }
    return snapshot;
  }
}
