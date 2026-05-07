import crypto from 'crypto';

export class HashRing {
  private readonly virtualNodes: number;
  private ring: Map<number, string>;
  private sortedKeys: number[];

  constructor(virtualNodes: number = 100) {
    this.virtualNodes = virtualNodes;
    this.ring = new Map();
    this.sortedKeys = [];
  }

  private hash(key: string): number {
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    // We take the first 8 characters (32 bits) to represent our ring space
    return parseInt(hash.substring(0, 8), 16);
  }

  public addNode(nodeId: string, weight: number = 1): void {
    const vNodesCount = Math.floor(this.virtualNodes * weight);
    for (let i = 0; i < vNodesCount; i++) {
      const vNodeKey = `${nodeId}-vnode-${i}`;
      const hashValue = this.hash(vNodeKey);
      this.ring.set(hashValue, nodeId);
      this.sortedKeys.push(hashValue);
    }
    this.sortKeys();
  }

  public removeNode(nodeId: string): void {
    const keysToRemove: number[] = [];
    for (const [hashValue, targetNodeId] of this.ring.entries()) {
      if (targetNodeId === nodeId) {
        keysToRemove.push(hashValue);
      }
    }

    for (const key of keysToRemove) {
      this.ring.delete(key);
    }

    this.sortedKeys = this.sortedKeys.filter((key) => !keysToRemove.includes(key));
    // Since we filtered, it's still sorted
  }

  private sortKeys(): void {
    this.sortedKeys.sort((a, b) => a - b);
  }

  public getNode(key: string): string | null {
    if (this.sortedKeys.length === 0) {
      return null;
    }

    const hashValue = this.hash(key);
    
    // Binary search for O(log n) lookup
    let left = 0;
    let right = this.sortedKeys.length - 1;

    // Edge case: if hash is greater than the largest key, wrap around to the first
    if (hashValue > this.sortedKeys[right]) {
      return this.ring.get(this.sortedKeys[0]) || null;
    }

    let resultIndex = right;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (this.sortedKeys[mid] >= hashValue) {
        resultIndex = mid;
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    return this.ring.get(this.sortedKeys[resultIndex]) || null;
  }

  // Get metrics about ring distribution
  public getDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    for (const [_, nodeId] of this.ring.entries()) {
      distribution[nodeId] = (distribution[nodeId] || 0) + 1;
    }
    return distribution;
  }
}
