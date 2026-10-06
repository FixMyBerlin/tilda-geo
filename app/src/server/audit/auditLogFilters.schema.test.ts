import { describe, expect, test } from 'vitest'
import { auditLogListSchema } from './auditLogFilters.schema'

describe('auditLogListSchema', () => {
  // The router parses `?userId=7` / `?recordId=7` as numbers; ids are strings in the DB.
  test('accepts numeric-looking ids from the URL', () => {
    expect(auditLogListSchema.parse({ userId: 7, recordId: 12 })).toMatchObject({
      userId: '7',
      recordId: '12',
    })
  })
})
