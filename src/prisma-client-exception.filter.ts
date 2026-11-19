import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from './generated/prisma/client.js';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    switch (exception.code) {
      case 'P2025': {
        const status = HttpStatus.NOT_FOUND;
        response.status(status).json({
          statusCode: status,
          error: 'Not Found',
          message: 'Запрашиваемая запись не найдена в базе данных.',
        });
        break;
      }
      case 'P2002': {
        const status = HttpStatus.CONFLICT;
        response.status(status).json({
          statusCode: status,
          error: 'Conflict',
          message: `Запись с таким значением уже существует. Дублирование поля: ${exception.meta?.target}`,
        });
        break;
      }
      case 'P2003': {
        const status = HttpStatus.BAD_REQUEST;
        response.status(status).json({
          statusCode: status,
          error: 'Bad Request',
          message:
            'Связанная сущность (указанный ID) не существует в базе данных.',
        });
        break;
      }
      case 'P2014': {
        const status = HttpStatus.CONFLICT;
        response.status(status).json({
          statusCode: status,
          error: 'Conflict',
          message:
            'У этого пользователя уже есть связанная запись. Нарушено ограничение "один к одному".',
        });
        break;
      }
      case 'P2034': {
        const status = HttpStatus.CONFLICT;
        response.status(status).json({
          statusCode: status,
          error: 'Conflict',
          message:
            'Запрос не удался из-за высокой нагрузки на базу данных. Пожалуйста, повторите попытку оформления сделки.',
        });
        break;
      }
      default:
        super.catch(exception, host);
        break;
    }
  }
}
