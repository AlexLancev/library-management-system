import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/**
 * Глобальный модуль Prisma.
 *
 * @Global() — PrismaService доступен во всех модулях
 * без явного импорта PrismaModule.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}