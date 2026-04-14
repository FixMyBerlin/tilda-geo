import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { optionalSearchString } from './searchParamsSchema'

describe('optionalSearchString', () => {
  const schema = z.object({ userId: optionalSearchString() })

  it('accepts numeric values like TanStack Router search parsing', () => {
    expect(schema.parse({ userId: 231 })).toEqual({ userId: '231' })
  })

  it('accepts string values', () => {
    expect(schema.parse({ userId: '231' })).toEqual({ userId: '231' })
  })

  it('maps empty string to undefined', () => {
    expect(schema.parse({ userId: '' })).toEqual({})
  })
})
