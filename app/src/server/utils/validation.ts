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
 * Converts FormData to a plain object with string values.
 * Useful for extracting form data before Zod validation.
 */
export function formDataToObject(formData: FormData) {
  const obj: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    obj[key] = value.toString()
  }
  return obj
}

/**
 * Extracts form data from FormData and validates it with a Zod schema in one step.
 * Throws ZodError if validation fails.
 *
 * @example
 * ```ts
 * try {
 *   const parsed = extractAndValidateFormData(formData, MySchema)
 *   await db.model.create({ data: parsed })
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     return validationErrorState(error)
 *   }
 *   return errorState(error, 'Fehler beim Speichern')
 * }
 * ```
 */
export function extractAndValidateFormData<T extends z.ZodTypeAny>(formData: FormData, schema: T) {
  const rawData = formDataToObject(formData)
  return schema.parse(rawData)
}

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
