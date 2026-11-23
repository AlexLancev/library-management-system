import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { DomainError } from '../errors/domain-error.js';

/**
 * Ловит DomainError, превращает в HTTP-ответ единого формата.
 *
 * Формат ответа — из 05-errors-and-handling.mdc:
 * {
 *   error: {
 *     code, message, details?, requestId, timestamp, path
 *   }
 * }
 */
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainErrorFilter.name);

  catch(error: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = (request as any).requestId as string | undefined;
    const logPayload = {
      msg: 'Domain error',
      code: error.code,
      httpStatus: error.httpStatus,
      path: request.url,
      method: request.method,
      requestId,
    };

    if (error.httpStatus >= 500) {
      this.logger.error(logPayload);
    } else {
      this.logger.warn(logPayload);
    }

    response.status(error.httpStatus).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}