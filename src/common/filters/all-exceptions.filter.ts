import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Request, Response } from 'express';

/**
 * Ловит ВСЁ, что не поймали другие фильтры.
 *
 * Приоритет обработки:
 * 1. ThrottlerException → RATE_LIMIT_EXCEEDED (429).
 * 2. BadRequestException от ValidationPipe → VALIDATION_FAILED (400).
 * 3. Прочие HttpException → HTTP_EXCEPTION.
 * 4. Всё остальное → INTERNAL_ERROR (500).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = (request as any).requestId as string | undefined;

    if (exception instanceof ThrottlerException) {
      response.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Слишком много запросов. Попробуйте позже.',
          requestId,
          timestamp: new Date().toISOString(),
          path: request.url,
        },
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      const isValidation =
        exception instanceof BadRequestException &&
        typeof body === 'object' &&
        body !== null &&
        'message' in body;

      const messages =
        typeof body === 'string'
          ? [body]
          : Array.isArray((body as any).message)
            ? (body as any).message
            : typeof (body as any).message === 'string'
              ? [(body as any).message]
              : ['Ошибка запроса'];

      response.status(status).json({
        error: {
          code: isValidation ? 'VALIDATION_FAILED' : 'HTTP_EXCEPTION',
          message: isValidation
            ? 'Ошибка валидации данных'
            : messages.join('; '),
          details: messages,
          requestId,
          timestamp: new Date().toISOString(),
          path: request.url,
        },
      });
      return;
    }

    const isProd = process.env.NODE_ENV === 'production';

    this.logger.error({
      msg: 'Unhandled exception',
      path: request.url,
      method: request.method,
      requestId,
      err: exception,
    });

    response.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: isProd ? 'Internal server error' : String(exception),
        details: isProd
          ? undefined
          : exception instanceof Error
            ? { stack: exception.stack }
            : undefined,
        requestId,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}