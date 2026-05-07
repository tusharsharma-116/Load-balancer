import { ILoadBalancingStrategy } from './ILoadBalancingStrategy';
import { Node } from '../types';
import { NodeManager } from '../core/NodeManager';

export class LeastConnectionsStrategy implements ILoadBalancingStrategy {
  public readonly name = 'LeastConnections';

  public route(clientIp: string, nodeManager: NodeManager): Node | null {
    const activeNodes = nodeManager.getActiveNodes();

    if (activeNodes.length === 0) {
      return null;
    }

    // Find the node with the absolute minimum active connections
    let selectedNode = activeNodes[0];
    let minConnections = selectedNode.activeConnections;

    for (let i = 1; i < activeNodes.length; i++) {
      const node = activeNodes[i];
      if (node.activeConnections < minConnections) {
        minConnections = node.activeConnections;
        selectedNode = node;
      }
    }

    return selectedNode;
  }
}
