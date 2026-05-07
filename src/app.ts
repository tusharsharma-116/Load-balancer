import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger';
import { router } from './api/routes';
import { tracingMiddleware } from './middleware/tracing';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security and basic middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Request Tracing
app.use(tracingMiddleware);

// Logging
app.use(pinoHttp({ logger }));

// API Routes
app.use('/api/v1', router);

// Error Handling
app.use(errorHandler);

export { app };
