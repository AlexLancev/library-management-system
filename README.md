# Library Management System

Backend-система управления библиотечной сетью: каталог книг, читатели, выдачи, резервации, штрафы, аналитика.

Построена на **NestJS + Prisma + PostgreSQL** с упором на **надёжность, корректность данных и поддерживаемость**.

---

## Содержание

- [Стек](#стек)
- [Архитектура](#архитектура)
- [Домен](#домен)
- [Быстрый старт](#быстрый-старт)
- [Переменные окружения](#переменные-окружения)
- [Структура проекта](#структура-проекта)
- [API](#api)
- [Аутентификация и права](#аутентификация-и-права)
- [Ключевые решения](#ключевые-решения)
- [Разработка](#разработка)
- [Тестирование](#тестирование)
- [Соглашения](#соглашения)
- [Roadmap](#roadmap)

---

## Стек

| Компонент | Технология |
|---|---|
| Runtime | Node.js 20+ |
| Язык | TypeScript 5+ (ESM) |
| Framework | NestJS 12 |
| ORM | Prisma 7 + `@prisma/adapter-pg` |
| БД | PostgreSQL 16 |
| Аутентификация | JWT (access) + opaque refresh-token |
| Хеширование паролей | argon2id |
| Rate limiting | `@nestjs/throttler` |
| Валидация | `class-validator` + `class-transformer` |
| Тесты | Vitest |
| Контейнеры | Docker Compose |

---

## Архитектура

### Слои

```
┌──────────────────────────────────┐
│ HTTP / Controllers (NestJS)      │  валидация (DTO), вызов сервиса
├──────────────────────────────────┤
│ Application Services             │  бизнес-логика (use cases)
├──────────────────────────────────┤
│ Domain (Policy, DomainError)     │  правила, инварианты
├──────────────────────────────────┤
│ Infrastructure (Prisma, JWT)     │  доступ к данным, аутентификация
└──────────────────────────────────┘
```

### Принципы

- **Тонкий контроллер, толстый сервис, чистый policy.**
- **Валидация** — на границе (Pipe + DTO).
- **Права** — в `Policy`, не в сервисе.
- **Scope** — в `findOne`, остальные методы переиспользуют.
- **События** (факты) — append-only.
- **Домен-ориентированные ошибки** → HTTP через фильтр.
- **Деньги** — `Decimal`, не `float`.

---

## Домен

### Сущности

| Сущность | Тип | Описание |
|---|---|---|
| `Staff` | Субъект | Сотрудник с админ-доступом (роли: ADMIN, LIBRARIAN, MANAGER) |
| `Author` | Справочник | Автор книги |
| `Genre` | Справочник | Жанр книги |
| `Book` | Собственность | Произведение (не физический экземпляр) |
| `BookCopy` | Собственность | Физический экземпляр книги (barcode, status) |
| `Reader` | Субъект (PII) | Читатель с паспортом |
| `ReaderPassport` | PII | Паспорт читателя (1:1) |
| `Loan` | **Факт** | Факт выдачи книги |
| `LoanRenewal` | **Факт** | Факт продления |
| `Reservation` | **Факт** | Резервация |
| `Fine` | **Факт** | Начисленный штраф |
| `FinePayment` | **Факт** | Платёж по штрафу |

### Ключевые инварианты

- Нельзя выдать книгу, если `BookCopy.status != AVAILABLE`.
- Нельзя выдать книгу читателю с `PENDING` штрафами.
- Максимум **5 активных выдач** на читателя.
- Срок выдачи — **14 дней**.
- Резервация — **48 часов**.
- `FinePayment.amount <= Fine.amount - уже оплачено`.
- Удаление шоурумов/читателей/книг запрещено при наличии активных фактов.
- `Staff`, `Reader`, `Book`, `BookCopy` — soft delete.

---

## Быстрый старт

### 1. Клонировать и установить

```bash
git clone <repo>
cd library
npm install
```

### 2. Поднять Postgres

```bash
docker compose up -d
```

**Ожидаемо:**
- `library-database` (Postgres 16) — порт `5432`.
- `library-pgadmin` (pgAdmin) — порт `5444`.

### 3. Настроить `.env`

См. [Переменные окружения](#переменные-окружения).

### 4. Применить миграции и seed

```bash
npm run migrate:dev
npm run prisma:seed
```

**Seed создаёт:**
- `admin@library.local` / `admin1234` (ADMIN).

### 5. Запустить сервер

```bash
npm run start:dev
```

**Ожидаемо:**
```
[Nest] ... LOG [NestApplication] Nest application successfully started
```

Сервер доступен на `http://localhost:3000/api/v1`.

---


## Структура проекта

```
src/
├── main.ts                        # bootstrap
├── app.module.ts                  # корневой модуль
├── common/
│   ├── errors/
│   │   └── domain-error.ts
│   ├── filters/
│   │   ├── domain-error.filter.ts
│   │   └── all-exceptions.filter.ts
│   ├── middleware/
│   │   └── request-id.middleware.ts
│   └── utils/
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── generated/
│   └── prisma/                    # автоген Prisma Client
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── services/
│   │   ├── password.service.ts
│   │   └── token.service.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── decorators/
│   │   ├── public.decorator.ts
│   │   └── current-user.decorator.ts
│   ├── dto/
│   ├── errors/
│   └── types/
├── staff/                         # аналогично для каждого модуля
├── authors/
├── genres/
├── books/
├── book-copies/
├── readers/
├── loans/
├── reservations/
├── fines/
└── analytics/

prisma/
├── schema.prisma
├── migrations/
└── seed.ts

.cursor/rules/                     # правила для AI-ревью
├── 00-review-mode.mdc
├── 01-prisma-schema.mdc
├── 02-auth-and-access.mdc
├── 03-service-solid.mdc
├── 04-prisma-queries.mdc
├── 05-errors-and-handling.mdc
├── 06-validation-dto.mdc
└── 08-prisma-p2002.mdc
```

### Модуль — типичная структура

```
modules/xxx/
├── xxx.module.ts
├── xxx.controller.ts
├── xxx.service.ts
├── xxx.policy.ts
├── xxx.types.ts
├── xxx.errors.ts
└── dto/
    ├── create-xxx.dto.ts
    ├── update-xxx.dto.ts
    └── find-xxx.dto.ts
```

---

## API

**База:** `/api/v1`.

**Формат ответа:**
```json
{
  "data": { ... },
  "meta": { "total": 42, "page": 1, "limit": 20, "lastPage": 3 }
}
```

**Формат ошибки:**
```json
{
  "error": {
    "code": "BOOK_NOT_FOUND",
    "message": "Книга не найдена",
    "details": { "bookId": "..." },
    "requestId": "...",
    "timestamp": "2026-10-16T10:00:00Z",
    "path": "/api/v1/books/..."
  }
}
```

### Endpoints

| Модуль | Endpoints |
|---|---|
| **Auth** | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| **Staff** | CRUD `/staff` |
| **Authors** | CRUD `/authors` |
| **Genres** | CRUD `/genres` |
| **Books** | CRUD `/books` |
| **BookCopies** | `POST/GET /books/:bookId/copies`, `GET/PATCH/DELETE /copies/:id`, `POST /copies/:id/lost`, `/repair`, `/return-from-repair` |
| **Readers** | CRUD `/readers` |
| **Loans** | `POST/GET /loans`, `GET /loans/:id`, `POST /loans/:id/return`, `POST /loans/:id/renew` |
| **Reservations** | `POST/GET /reservations`, `GET /reservations/:id`, `POST /reservations/:id/cancel`, `/fulfill`, `POST /reservations/expire` |
| **Fines** | `POST/GET /fines`, `GET /fines/:id`, `POST /fines/:id/pay`, `/waive` |
| **Analytics** | `GET /analytics/books/top`, `/readers/active`, `/overdue`, `/fines` |

**Заголовки:**
- `Authorization: Bearer <access-token>` — обязательно.
- `X-Request-Id: <uuid>` — опционально (для трассировки).
- `Idempotency-Key: <uuid>` — для `POST /loans` (пока не используется).

---

## Аутентификация и права

### Токены

| Токен | TTL | Хранение |
|---|---|---|
| **Access** | 15 мин | JWT (не хранится) |
| **Refresh** | 30 дней | Opaque, хеш в `Staff.refreshToken` |

**Payload access-token:**
```json
{
  "sub": "<staff-id>",
  "role": "ADMIN",
  "iat": 1728800000,
  "exp": 1728800900,
  "iss": "library-api",
  "aud": "library-client"
}
```

### Роли

| Роль | Права |
|---|---|
| `ADMIN` | Всё, включая управление персоналом |
| `LIBRARIAN` | Каталог (чтение), выдачи, резервации, штрафы (кроме waive), читатели |
| `MANAGER` | Аналитика, прощение штрафов, чтение каталога |

### Три уровня проверки

1. **Аутентификация** — глобальный `JwtAuthGuard` (401).
2. **Роль** — `Policy` (403).
3. **Scope** — в сервисе через `findFirst` (404 для чужих).

## Разработка

### Скрипты

```bash
npm run start:dev        # watch mode
npm run start:debug      # debug + watch
npm run build            # сборка
npm run start:prod       # production

npm run lint             # oxlint
npm run format           # prettier

npm run migrate:dev      # миграции + generate
npm run migrate:prod     # deploy миграций
npm run prisma:studio    # Prisma Studio (GUI)
npm run prisma:seed      # seed
```

### Миграции

```bash
# Создать миграцию
npx prisma migrate dev --name add_something

# Применить в prod
npx prisma migrate deploy

# Сбросить БД (dev)
npx prisma migrate reset
```

### Обновление Prisma Client

```bash
npx prisma generate
```

**Запускается автоматически** при `migrate:dev`.

---


## Соглашения

### Доменные ошибки

Все — в `xxx.errors.ts`, наследуются от `DomainError`:

```typescript
export class BookNotFoundError extends DomainError {
  readonly code = 'BOOK_NOT_FOUND';
  readonly httpStatus = 404;
  constructor() {
    super('Книга не найдена');
  }
}
```

**Коды:** `UPPER_SNAKE_CASE`. **HTTP:** правильный статус. **Message:** для **пользователя**.

### Формат ID

| Сущность | Тип ID |
|---|---|
| Субъект / собственность | UUID v4 |
| Факты | UUID v4 |
| M:N join | Composite (`@@id([aId, bId])`) |

### Соглашения `Prisma`

- Таблицы — `@@map("snake_case")`.
- Колонки — **camelCase** (без `@map`).
- Индексы — под **запросы**, а не «на всякий случай».
- `onDelete` — осознанно.

---

## Roadmap

### v1 (текущий)
- [x] Auth + RBAC
- [x] Каталог (Authors, Genres, Books, BookCopies)
- [x] Читатели
- [x] Выдачи + продление + возврат
- [x] Резервации
- [x] Штрафы (частичные оплаты, waive)
- [x] Аналитика

### v2 (планируется)
- [ ] Swagger / OpenAPI
- [ ] Unit + integration тесты (Vitest + testcontainers)
- [ ] Pino structured logging
- [ ] Healthchecks (`/health`, `/ready`)
- [ ] Cron для `expireOverdue` и `OVERDUE` loan status
- [ ] `Idempotency-Key` для `POST /loans`
- [ ] Docker образ приложения
- [ ] CI/CD (GitHub Actions)
- [ ] Email-уведомления (просрочка, готовность резерва)
- [ ] Кабинет читателя (личный)
- [ ] Кабинет продавца

---

## Лицензия

UNLICENSED (private).