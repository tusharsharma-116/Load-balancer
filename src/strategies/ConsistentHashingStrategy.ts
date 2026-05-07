import { ILoadBalancingStrategy } from './ILoadBalancingStrategy';
import { Node } from '../types';
import { NodeManager } from '../core/NodeManager';
import { HashRing } from '../core/HashRing';

export class ConsistentHashingStrategy implements ILoadBalancingStrategy {
  public readonly name = 'ConsistentHashing';
  private hashRing: HashRing;

  constructor(virtualNodes: number = 100) {
    this.hashRing = new HashRing(virtualNodes);
  }

  public route(clientIp: string, nodeManager: NodeManager): Node | null {
    // 1. Get the assigned node ID from the hash ring
    let targetNodeId = this.hashRing.getNode(clientIp);
    
    if (!targetNodeId) {
      return null;
    }

    // 2. Verify the node is actually active
    let targetNode = nodeManager.getNode(targetNodeId);

    // If node is dead or draining, we need a fallback mechanism
    // In a real system we might try the next node on the ring
    // For simplicity, if it's not active, we append a nonce to the IP to hash to another node
    let retryCount = 0;
    while ((!targetNode || targetNode.status !== 'active') && retryCount < 3) {
      retryCount++;
      targetNodeId = this.hashRing.getNode(`${clientIp}-retry-${retryCount}`);
      if (targetNodeId) {
        targetNode = nodeManager.getNode(targetNodeId);
      }
    }

    if (targetNode && targetNode.status === 'active') {
      return targetNode;
    }

    // If still failing, fallback to getting any active node (handled by the caller or engine)
    return null;
  }

  public onNodeAdded(node: Node): void {
    // Incorporate weight into the number of virtual nodes
    this.hashRing.addNode(node.id, node.weight);
  }

  public onNodeRemoved(nodeId: string): void {
    this.hashRing.removeNode(nodeId);
  }
}
