import { Node } from '../types';
import { NodeManager } from '../core/NodeManager';

export interface ILoadBalancingStrategy {
  readonly name: string;
  
  /**
   * Route a request to a node based on the strategy.
   * @param clientIp The IP address of the client making the request.
   * @param nodeManager The NodeManager instance to query active nodes.
   * @returns The selected Node, or null if no nodes are available.
   */
  route(clientIp: string, nodeManager: NodeManager): Node | null;
  
  /**
   * Optional hook called when a node is added to the pool.
   */
  onNodeAdded?(node: Node): void;

  /**
   * Optional hook called when a node is removed from the pool.
   */
  onNodeRemoved?(nodeId: string): void;
}
