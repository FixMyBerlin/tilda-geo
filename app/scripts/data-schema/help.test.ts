import { describe, expect, it } from 'vitest'
import { formatDataSchemaDocsHelp } from './help'

describe('formatDataSchemaDocsHelp', () => {
  it('points at the README chapter from app/', () => {
    expect(formatDataSchemaDocsHelp('new-or-updated-data')).toBe(
      'General setup: Read ../data-schema/README.md#new-or-updated-data',
    )
    expect(formatDataSchemaDocsHelp('get-data-onto-every-environment')).toBe(
      'General setup: Read ../data-schema/README.md#get-data-onto-every-environment',
    )
  })
})
