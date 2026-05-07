export type NodeStatus = 'active' | 'draining' | 'dead' | 'recovering';

export interface Node {
  id: string;
  host: string;
  port: number;
  weight: number;
  status: NodeStatus;
  healthScore: number; // 0 to 100
  activeConnections: number;
  requestCount: number;
  averageLatency: number; // in ms
  failureCount: number;
  recoveryState: boolean;
  lastHeartbeat: number; // timestamp
}

export interface RouteDecision {
  clientIp: string;
  timestamp: number;
  strategy: string;
  selectedNode: Node | null;
  requestLatency: number;
  traceId: string;
  healthSnapshot: Record<string, NodeStatus>;
  retryCount: number;
  failoverStatus: boolean;
}

export interface MetricSnapshot {
  requestsPerSecond: number;
  averageLatency: number;
  errorRate: number;
  failoverCount: number;
  totalRequests: number;
}
