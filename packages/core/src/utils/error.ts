import postgres from 'postgres'
import zod from 'zod'

export enum CoreErrorType {
  /**
   * The error that has was not of the expected types! This could be because of a bug
   */
  Unexpected,

  /**
   * The error was of a recognized type, but not categorized
   */
  Other,

  /**
   * A foreign key constraint was violated
   */
  ForeignKey,

  /**
   * A unique key constraint was violated
   */
  UniqueKey,

  /**
   * A not null constraint was violated
   */
  NotNull,

  /**
   * A database check constraint was violated
   */
  Check,

  /**
   * Validation failed
   */
  Validation,
}

/**
 * Error class for the core layer. All errors should be of this type. This type could be
 * extended to contain more information about validation or constraint validation.
 */
export class CoreError extends Error {
  constructor(
    public readonly type: CoreErrorType,
    public readonly antecedentError?: Error,
  ) {
    const message =
      antecedentError == null
        ? CoreErrorType[type]
        : `${CoreErrorType[type]} / ${antecedentError.message}`

    super(message)
  }

  public static fromUnknown(error: unknown) {
    if (error instanceof postgres.PostgresError) {
      return this.fromPostgresError(error)
    }

    if (error instanceof zod.ZodError) {
      return this.fromZodError(error)
    }

    if (error instanceof Error) {
      return this.fromError(error)
    }

    return
  }

  public static fromError(error: Error) {
    return new CoreError(CoreErrorType.Unexpected, error)
  }

  public static fromPostgresError(error: postgres.PostgresError) {
    // https://www.postgresql.org/docs/current/errcodes-appendix.html
    switch (error.code) {
      case '23000': // integrity_constraint_violation
        return new CoreError(CoreErrorType.Other, error)
      case '23001': // restrict_violation
        return new CoreError(CoreErrorType.Other, error)
      case '23502': // not_null_violation
        return new CoreError(CoreErrorType.NotNull, error)
      case '23503': // foreign_key_violation
        return new CoreError(CoreErrorType.ForeignKey, error)
      case '23505': // unique_violation
        return new CoreError(CoreErrorType.UniqueKey, error)
      case '23514': // check_violation
        return new CoreError(CoreErrorType.Check, error)
      case '23P01': // exclusion_violation
        return new CoreError(CoreErrorType.Other, error)

      default:
        return new CoreError(CoreErrorType.Unexpected, error)
    }
  }

  public static fromZodError(error: zod.ZodError) {
    return new CoreError(CoreErrorType.Validation, error)
  }
}
