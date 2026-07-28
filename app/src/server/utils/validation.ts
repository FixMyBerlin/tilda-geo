import { z } from 'zod'

/**
 * Standard form state returned by Server Actions using useActionState.
 * Used consistently across all form mutations.
 * Discriminated union with `success` as the discriminator for type narrowing.
 * `errors` is always present (empty object `{}` on success) for simpler component code.
 */
export type FormState =
  | { success: true; message: string; errors: Record<string, never> }
  | { success: false; message: string; errors: Record<string, string[]> }

/**
 * Returns a FormState for validation errors.
 * Use when catching ZodError from form validation.
 */
export function validationErrorState(error: z.ZodError) {
  return {
    success: false,
    message: 'Bitte korrigieren Sie die Fehler im Formular',
    errors: z.flattenError(error).fieldErrors,
  }
}

/**
 * Returns a FormState for general errors.
 * Use for non-validation errors (database errors, etc.).
 */
export function errorState(error: unknown, defaultMessage: string) {
  return {
    success: false,
    message: error instanceof Error ? error.message : defaultMessage,
    errors: {},
  }
}
