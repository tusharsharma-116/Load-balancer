import { MetricSnapshot } from '../types';
import { logger } from '../utils/logger';

interface RequestRecord {
  timestamp: number;
  latency: number;
  error: boolean;
  failover: boolean;
}

export class MetricsManager {
  private windowSizeMs: number;
  private requests: RequestRecord[] = [];
  private totalRequests: number = 0;

  constructor(windowSizeMs: number = 60000) {
    this.windowSizeMs = windowSizeMs;
  }

  public recordRequest(latency: number, error: boolean, failover: boolean): void {
    const timestamp = Date.now();
    this.requests.push({ timestamp, latency, error, failover });
    this.totalRequests++;
    this.cleanOldRecords();
  }

  private cleanOldRecords(): void {
    const cutoff = Date.now() - this.windowSizeMs;
    // Find the index of the first record within the window
    let i = 0;
    while (i < this.requests.length && this.requests[i].timestamp < cutoff) {
      i++;
    }
    if (i > 0) {
      this.requests.splice(0, i);
    }
  }

  public getSnapshot(): MetricSnapshot {
    this.cleanOldRecords();

    const count = this.requests.length;
    if (count === 0) {
      return {
        requestsPerSecond: 0,
        averageLatency: 0,
        errorRate: 0,
        failoverCount: 0,
        totalRequests: this.totalRequests,
      };
    }

    let totalLatency = 0;
    let errors = 0;
    let failovers = 0;

    for (const req of this.requests) {
      totalLatency += req.latency;
      if (req.error) errors++;
      if (req.failover) failovers++;
    }

    // calculate rate based on window size or elapsed time if less than window
    const firstReqTime = this.requests[0].timestamp;
    const now = Date.now();
    const elapsed = Math.max(1000, now - firstReqTime); // at least 1s to avoid Infinity
    const seconds = Math.min(elapsed, this.windowSizeMs) / 1000;

    return {
      requestsPerSecond: Number((count / seconds).toFixed(2)),
      averageLatency: Number((totalLatency / count).toFixed(2)),
      errorRate: Number((errors / count).toFixed(4)),
      failoverCount: failovers,
      totalRequests: this.totalRequests,
    };
  }
}

export const metricsManager = new MetricsManager();
