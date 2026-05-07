import { Request, Response, NextFunction } from 'express';
import { engine } from '../core/Engine';

export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-ip';
  
  if (!engine.rateLimiter.allowRequest(clientIp)) {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded for your IP. Please try again later.'
    });
    return;
  }
  
  next();
};
