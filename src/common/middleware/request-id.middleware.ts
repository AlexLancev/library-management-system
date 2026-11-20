import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

/**
 * Middleware: назначает requestId каждому запросу.
 *
 * - Если клиент прислал X-Request-Id (валидный UUID) — используем его.
 * - Иначе — генерируем новый.
 * - Кладём в req.requestId (для фильтров).
 * - Отдаём в ответе как X-Request-Id (для трассировки на клиенте).
 *
 * Правило 02-auth-and-access: requestId нужен для сквозной трассировки.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.headers['x-request-id'];
    const candidate =
      typeof incoming === 'string' && this.uuidRegex.test(incoming)
        ? incoming
        : randomUUID();

    (req as any).requestId = candidate;
    res.setHeader('X-Request-Id', candidate);

    next();
  }
}