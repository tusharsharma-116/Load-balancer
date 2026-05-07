export class RateLimiter {
  private ipBuckets: Map<string, { tokens: number; lastRefill: number }>;
  private readonly capacity: number;
  private readonly refillRate: number; // Tokens per second

  constructor(capacity: number = 100, refillRate: number = 10) {
    this.ipBuckets = new Map();
    this.capacity = capacity;
    this.refillRate = refillRate;
  }

  public allowRequest(ip: string): boolean {
    const now = Date.now();
    
    if (!this.ipBuckets.has(ip)) {
      this.ipBuckets.set(ip, { tokens: this.capacity - 1, lastRefill: now });
      return true;
    }

    const bucket = this.ipBuckets.get(ip)!;
    
    // Calculate tokens to add based on elapsed time
    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = elapsedSeconds * this.refillRate;
    
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }

  // Periodic cleanup of stale buckets to prevent memory leaks
  public cleanupStaleBuckets(staleThresholdMs: number = 600000): void {
    const now = Date.now();
    for (const [ip, bucket] of this.ipBuckets.entries()) {
      if (now - bucket.lastRefill > staleThresholdMs) {
        this.ipBuckets.delete(ip);
      }
    }
  }
}
