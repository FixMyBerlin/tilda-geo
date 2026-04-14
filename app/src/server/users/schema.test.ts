import { describe, expect, test } from 'vitest'
import { osmPlaceholderEmail } from '@/components/shared/utils/osmPlaceholderEmail'
import { UpdateUserSchema } from './schema'

describe('UpdateUserSchema', () => {
  test('rejects OSM placeholder email', () => {
    const result = UpdateUserSchema.safeParse({
      email: osmPlaceholderEmail(99),
      firstName: 'A',
      lastName: 'B',
      osmDescription: null,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('email'))).toBe(true)
    }
  })

  test('accepts real email', () => {
    const result = UpdateUserSchema.safeParse({
      email: 'user@example.com',
      firstName: 'A',
      lastName: 'B',
      osmDescription: null,
    })
    expect(result.success).toBe(true)
  })
})
