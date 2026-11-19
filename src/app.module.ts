import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { StaffModule } from './staff/staff.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { AuthorsModule } from './authors/authors.module.js';
import { GenresModule } from './genres/genres.module.js';
import { BooksModule } from './books/books.module.js';
import { BookCopiesModule } from './book-copies/book-copies.module.js';
import { ReadersModule } from './readers/readers.module.js';
import { LoansModule } from './loans/loans.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { FinesModule } from './fines/fines.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, 
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    StaffModule,
    AuthorsModule,
    GenresModule,
    BooksModule,
    BookCopiesModule,
    ReadersModule,
    LoansModule,
    ReservationsModule,
    FinesModule,
    AnalyticsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}