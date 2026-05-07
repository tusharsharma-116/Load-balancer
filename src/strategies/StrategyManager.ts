import { ILoadBalancingStrategy } from './ILoadBalancingStrategy';
import { ConsistentHashingStrategy } from './ConsistentHashingStrategy';
import { LeastConnectionsStrategy } from './LeastConnectionsStrategy';
import { RoundRobinStrategy } from './RoundRobinStrategy';
import { Node } from '../types';

export type StrategyType = 'ConsistentHashing' | 'LeastConnections' | 'RoundRobin';

export class StrategyManager {
  private strategies: Map<string, ILoadBalancingStrategy>;
  private activeStrategyName: string;

  constructor(defaultStrategy: StrategyType = 'ConsistentHashing') {
    this.strategies = new Map();
    this.activeStrategyName = defaultStrategy;

    // Register default strategies
    this.registerStrategy(new ConsistentHashingStrategy());
    this.registerStrategy(new LeastConnectionsStrategy());
    this.registerStrategy(new RoundRobinStrategy());
  }

  public registerStrategy(strategy: ILoadBalancingStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  public setActiveStrategy(name: StrategyType): void {
    if (!this.strategies.has(name)) {
      throw new Error(`Strategy ${name} not found`);
    }
    this.activeStrategyName = name;
  }

  public getActiveStrategy(): ILoadBalancingStrategy {
    return this.strategies.get(this.activeStrategyName)!;
  }

  public notifyNodeAdded(node: Node): void {
    for (const strategy of this.strategies.values()) {
      if (strategy.onNodeAdded) {
        strategy.onNodeAdded(node);
      }
    }
  }

  public notifyNodeRemoved(nodeId: string): void {
    for (const strategy of this.strategies.values()) {
      if (strategy.onNodeRemoved) {
        strategy.onNodeRemoved(nodeId);
      }
    }
  }
}
