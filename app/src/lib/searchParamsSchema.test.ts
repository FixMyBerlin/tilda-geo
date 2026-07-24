import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  optionalSearchBoolean,
  optionalSearchJson,
  optionalSearchString,
  searchBoolean,
  searchStringArray,
} from './searchParamsSchema'

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

  it('maps null to undefined', () => {
    expect(schema.parse({ userId: null })).toEqual({})
  })
})

describe('searchBoolean', () => {
  const schema = z.object({ flag: searchBoolean(false) })

  it('defaults missing values to false', () => {
    expect(schema.parse({})).toEqual({ flag: false })
  })

  it('parses wire strings', () => {
    expect(schema.parse({ flag: 'true' })).toEqual({ flag: true })
    expect(schema.parse({ flag: 'false' })).toEqual({ flag: false })
  })

  it('falls back on invalid values', () => {
    expect(schema.parse({ flag: 'maybe' })).toEqual({ flag: false })
  })
})

describe('optionalSearchBoolean', () => {
  const schema = z.object({ flag: optionalSearchBoolean() })

  it('stays undefined when absent', () => {
    expect(schema.parse({})).toEqual({})
  })

  it('parses wire strings', () => {
    expect(schema.parse({ flag: 'true' })).toEqual({ flag: true })
  })
})

describe('searchStringArray', () => {
  const schema = z.object({ data: searchStringArray() })

  it('defaults missing values to an empty array', () => {
    expect(schema.parse({})).toEqual({ data: [] })
  })

  it('parses comma-separated strings', () => {
    expect(schema.parse({ data: 'a,b' })).toEqual({ data: ['a', 'b'] })
  })

  it('accepts native arrays', () => {
    expect(schema.parse({ data: ['x'] })).toEqual({ data: ['x'] })
  })
})

describe('optionalSearchJson', () => {
  const filterSchema = z.object({
    query: z.string().optional(),
    completed: z.boolean().optional(),
  })
  const schema = z.object({ filter: optionalSearchJson(filterSchema) })

  it('parses router objects', () => {
    expect(schema.parse({ filter: { query: 'x' } })).toEqual({ filter: { query: 'x' } })
  })

  it('parses JSON strings', () => {
    expect(schema.parse({ filter: '{"query":"x"}' })).toEqual({ filter: { query: 'x' } })
  })
})
