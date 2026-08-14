import { describe, expect, it } from 'vitest'
import { formatDataSchemaDocsHelp } from './help'

describe('formatDataSchemaDocsHelp', () => {
  it('points at the README chapter from app/', () => {
    expect(formatDataSchemaDocsHelp('new-table')).toBe(
      'General setup: Read ../data-schema/README.md#new-table',
    )
    expect(formatDataSchemaDocsHelp('existing-table')).toBe(
      'General setup: Read ../data-schema/README.md#existing-table',
    )
  })
})
