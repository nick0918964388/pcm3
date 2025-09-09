export class AuthError extends Error {
  constructor(
    message: string = 'Authentication failed',
    public code: string = 'AUTH_ERROR'
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export class ValidationError extends Error {
  constructor(
    message: string = 'Validation failed',
    public code: string = 'VALIDATION_ERROR'
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class DatabaseError extends Error {
  constructor(
    message: string = 'Database operation failed',
    public code: string = 'DATABASE_ERROR'
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export const standardErrorMessages = {
  AUTH_INVALID_CREDENTIALS: 'Invalid username or password',
  AUTH_USER_NOT_FOUND: 'Invalid username or password',
  AUTH_PASSWORD_INVALID: 'Invalid username or password',
  AUTH_SESSION_EXPIRED: 'Session has expired',
  AUTH_SESSION_INVALID: 'Invalid session',
  AUTH_UNAUTHORIZED: 'Authentication required',
  VALIDATION_MISSING_FIELD: 'Required field is missing',
  VALIDATION_INVALID_FORMAT: 'Invalid input format',
  DATABASE_CONNECTION_FAILED: 'Service temporarily unavailable',
  DATABASE_QUERY_FAILED: 'Service temporarily unavailable',
  SERVER_INTERNAL_ERROR: 'Internal server error'
}

export function getStandardErrorMessage(code: keyof typeof standardErrorMessages): string {
  return standardErrorMessages[code] || standardErrorMessages.SERVER_INTERNAL_ERROR
}