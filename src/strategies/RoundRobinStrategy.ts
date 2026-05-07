import { ILoadBalancingStrategy } from './ILoadBalancingStrategy';
import { Node } from '../types';
import { NodeManager } from '../core/NodeManager';

export class RoundRobinStrategy implements ILoadBalancingStrategy {
  public readonly name = 'RoundRobin';
  private currentIndex: number = 0;

  public route(clientIp: string, nodeManager: NodeManager): Node | null {
    const activeNodes = nodeManager.getActiveNodes();

    if (activeNodes.length === 0) {
      return null;
    }

    // Ensure index is within bounds (in case nodes were removed)
    if (this.currentIndex >= activeNodes.length) {
      this.currentIndex = 0;
    }

    const selectedNode = activeNodes[this.currentIndex];
    
    // Increment and wrap around
    this.currentIndex = (this.currentIndex + 1) % activeNodes.length;

    return selectedNode;
  }
}
