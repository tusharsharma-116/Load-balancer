import { Request, Response } from 'express';
import { engine } from '../core/Engine';
import { metricsManager } from '../metrics/MetricsManager';
import { SimulationEngine } from '../simulation/SimulationEngine';
import { Node, RouteDecision } from '../types';
import { StrategyType } from '../strategies/StrategyManager';

const simulator = new SimulationEngine(engine);

export class LoadBalancerController {
  // --- Health Endpoints ---
  public static getHealth(req: Request, res: Response): void {
    res.json({ status: 'ok', uptime: process.uptime() });
  }

  public static getNodesHealth(req: Request, res: Response): void {
    const snapshot = engine.nodeManager.getHealthSnapshot();
    res.json(snapshot);
  }

  // --- Routing Endpoints ---
  public static routeRequest(req: Request, res: Response): void {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-ip';
    const decision: RouteDecision = engine.routeRequest(clientIp);

    metricsManager.recordRequest(decision.requestLatency, !decision.selectedNode, decision.failoverStatus);

    if (!decision.selectedNode) {
      res.status(503).json({ error: 'Service Unavailable', message: 'No active nodes available to handle the request.' });
      return;
    }

    // In a real load balancer, we would proxy the request here.
    // For this simulation, we just return the routing decision.
    res.json({
      message: 'Request routed successfully',
      decision
    });
  }

  // --- Nodes Management Endpoints ---
  public static getNodes(req: Request, res: Response): void {
    const nodes = engine.nodeManager.getAllNodes();
    res.json(nodes);
  }

  public static addNode(req: Request, res: Response): void {
    const node: Node = req.body;
    if (!node.id || !node.host || !node.port) {
      res.status(400).json({ error: 'Bad Request', message: 'Missing required node fields' });
      return;
    }
    
    // Ensure default values
    const newNode: Node = {
      ...node,
      weight: node.weight ?? 1,
      status: node.status ?? 'active',
      healthScore: node.healthScore ?? 100,
      activeConnections: node.activeConnections ?? 0,
      requestCount: node.requestCount ?? 0,
      averageLatency: node.averageLatency ?? 0,
      failureCount: node.failureCount ?? 0,
      recoveryState: node.recoveryState ?? false,
      lastHeartbeat: node.lastHeartbeat ?? Date.now(),
    };

    engine.addNode(newNode);
    res.status(201).json({ message: 'Node added successfully', node: newNode });
  }

  public static removeNode(req: Request, res: Response): void {
    const { id } = req.params;
    if (typeof id === 'string') {
      engine.removeNode(id);
      res.json({ message: `Node ${id} removed successfully` });
    } else {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid node ID' });
    }
  }

  // --- Metrics Endpoints ---
  public static getMetrics(req: Request, res: Response): void {
    const snapshot = metricsManager.getSnapshot();
    res.json(snapshot);
  }

  // --- Simulation Endpoints ---
  public static simulateTraffic(req: Request, res: Response): void {
    const { rate, duration } = req.body;
    if (!rate || !duration) {
      res.status(400).json({ error: 'Bad Request', message: 'rate and duration are required' });
      return;
    }
    simulator.simulateTraffic(Number(rate), Number(duration));
    res.json({ message: `Traffic simulation started at ${rate} req/s for ${duration}ms` });
  }

  public static simulateSpike(req: Request, res: Response): void {
    const { requests } = req.body;
    if (!requests) {
      res.status(400).json({ error: 'Bad Request', message: 'requests count is required' });
      return;
    }
    simulator.simulateSpike(Number(requests));
    res.json({ message: `Traffic spike simulated with ${requests} requests` });
  }

  public static simulateFailure(req: Request, res: Response): void {
    const { nodeId, duration } = req.body;
    if (!nodeId || !duration) {
      res.status(400).json({ error: 'Bad Request', message: 'nodeId and duration are required' });
      return;
    }
    simulator.simulateNodeFailure(nodeId, Number(duration));
    res.json({ message: `Node failure simulated for ${nodeId} for ${duration}ms` });
  }

  // --- Configuration Endpoints ---
  public static setStrategy(req: Request, res: Response): void {
    const { strategy } = req.body;
    const validStrategies = ['ConsistentHashing', 'LeastConnections', 'RoundRobin'];
    
    if (!validStrategies.includes(strategy as StrategyType)) {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid strategy type' });
      return;
    }
    
    engine.setStrategy(strategy as StrategyType);
    res.json({ message: `Strategy changed to ${strategy}` });
  }
}
