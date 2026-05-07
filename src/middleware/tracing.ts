import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const tracingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const traceId = (req.headers['x-trace-id'] as string) || uuidv4();
  req.headers['x-trace-id'] = traceId;
  res.setHeader('X-Trace-Id', traceId);
  next();
};
