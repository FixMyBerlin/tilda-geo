import { describe, expect, test } from 'vitest'
import { z } from 'zod'
import { validationErrorState } from './validation'

const schema = z
  .object({ name: z.string().min(1, 'Name fehlt'), age: z.number() })
  .refine((data) => data.age > 17, { message: 'Zu jung' })

const errorFor = (input: unknown) => {
  const result = schema.safeParse(input)
  if (result.success) throw new Error('Expected a validation error')
  return result.error
}

describe('validationErrorState', () => {
  test('uses errors without a field as the message', () => {
    expect(validationErrorState(errorFor({ name: 'Alex', age: 3 }))).toEqual({
      success: false,
      message: 'Zu jung',
      errors: {},
    })
  })

  test('falls back to the generic message for field errors', () => {
    expect(validationErrorState(errorFor({ name: '', age: 18 }))).toEqual({
      success: false,
      message: 'Bitte korrigieren Sie die Fehler im Formular',
      errors: { name: ['Name fehlt'] },
    })
  })
})
