import { describe, expect, it } from 'vitest'
import { formatDataSchemaBigPictureHelp } from './help'

describe('formatDataSchemaBigPictureHelp', () => {
  it('names the produce and consume steps', () => {
    const help = formatDataSchemaBigPictureHelp()
    expect(help).toContain('skill `/add-db-data-table`')
    expect(help).toContain('`bun run data-schema-load`')
    expect(help).toContain('`bun run data-schema-publish`')
    expect(help).toContain('/admin/data-schema')
    expect(help).toContain('data-schema-pull')
  })
})
