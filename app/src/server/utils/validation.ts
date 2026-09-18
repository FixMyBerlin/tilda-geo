import { z } from 'zod'

/*
 * Standard form state returned by the helpers below, used consistently across form mutations:
 * `{ success, message, errors }`, discriminated by `success` for type narrowing.
 * `errors` is always present (empty object `{}` on success) for simpler component code.
 */

/**
 * Returns the form state for validation errors.
 * Use when catching ZodError from form validation.
 */
export function validationErrorState(error: z.ZodError) {
  return {
    success: false as const,
    message: 'Bitte korrigieren Sie die Fehler im Formular',
    errors: z.flattenError(error).fieldErrors,
  }
}

/**
 * Returns the form state for general errors.
 * Use for non-validation errors (database errors, etc.).
 */
export function errorState(error: unknown, defaultMessage: string) {
  return {
    success: false as const,
    message: error instanceof Error ? error.message : defaultMessage,
    errors: {},
  }
}

/**
 * Returns the form state for successful mutations.
 */
export function successState(): {
  success: true
  message: string
  errors: Record<string, never>
}
export function successState<T>(options: { message?: string; data: T }): {
  success: true
  message: string
  errors: Record<string, never>
  data: T
}
export function successState(options?: { message?: string }): {
  success: true
  message: string
  errors: Record<string, never>
}
export function successState<T>(options?: { message?: string; data?: T }) {
  const message = options?.message ?? ''
  if (options !== undefined && 'data' in options) {
    return {
      success: true as const,
      message,
      errors: {} as Record<string, never>,
      data: options.data,
    }
  }
  return { success: true as const, message, errors: {} as Record<string, never> }
}
