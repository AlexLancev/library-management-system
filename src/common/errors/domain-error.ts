/**
 * Базовый класс всех доменных ошибок.
 *
 * Правило 05-errors-and-handling: сервис кидает DomainError,
 * фильтр превращает в HTTP. Сервис не знает про HTTP-статусы
 * напрямую — только через httpStatus.
 */
export abstract class DomainError extends Error {
  /**
   * Доменный код ошибки. UPPER_SNAKE_CASE.
   * Клиент может на него опираться.
   */
  abstract readonly code: string;

  /**
   * HTTP-статус, который вернёт фильтр.
   * 400, 401, 403, 404, 409, 422, 429, 500, 502, 503.
   */
  abstract readonly httpStatus: number;

  /**
   * Дополнительный контекст. Например, какое поле не прошло валидацию.
   * Уходит в ответ как error.details. Не должен содержать PII.
   */
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.details = details;
    Error.captureStackTrace?.(this, new.target);
  }
}
