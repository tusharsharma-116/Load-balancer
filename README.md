# Enterprise-Grade Load Balancer Backend

A highly scalable, pluggable load balancer backend implemented in Node.js, TypeScript, and Express.js. This system manages node pools, monitors health, and routes incoming traffic using sophisticated algorithms like Consistent Hashing.

## Features

- **Pluggable Strategies**: Consistent Hashing, Least Connections, Round Robin.
- **Node Management**: Dynamic registration, removal, and health tracking of nodes.
- **Middleware**: Built-in IP-based rate limiting, request tracing (`X-Trace-Id`), and global error handling.
- **Metrics Engine**: Real-time sliding-window analytics tracking latency, requests per second, error rates, and failover counts.
- **Simulation**: In-built simulation engine to trigger traffic spikes and node failures to test resilience.

## Prerequisites

- Node.js (v18+)
- npm

## Setup Instructions

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/tusharsharma-116/Load-balancer.git
   cd Load-balancer
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Development Mode
To run the server with hot-reloading (ideal for development):
```bash
npm run dev
```

### Production Build
To compile the TypeScript code and start the production server:
```bash
npm run build
npm start
```

The load balancer will start on `http://localhost:3000`. By default, the engine initializes with three active virtual nodes (`node-1`, `node-2`, `node-3`) for immediate testing.

## API Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Check overall load balancer health and uptime. |
| GET | `/api/v1/health/nodes` | Get a real-time status snapshot of all registered nodes. |
| GET | `/api/v1/route/request` | Route a single request through the active load balancing strategy. |
| GET | `/api/v1/nodes` | Get detailed information about all nodes in the pool. |
| GET | `/api/v1/metrics` | Fetch sliding-window metrics (req/sec, latency, failovers). |

