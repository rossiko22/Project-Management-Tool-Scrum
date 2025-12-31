import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AsyncLocalStorage } from 'async_hooks';

export const correlationIdStorage = new AsyncLocalStorage<string>();

export const CORRELATION_ID_HEADER = 'x-correlation-id';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Get correlation ID from header or generate new one
    const correlationId = req.get(CORRELATION_ID_HEADER) || uuidv4();

    // Set in response headers
    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    // Store in AsyncLocalStorage for access throughout the request lifecycle
    correlationIdStorage.run(correlationId, () => {
      next();
    });
  }
}

export function getCorrelationId(): string {
  return correlationIdStorage.getStore() || 'NONE';
}
