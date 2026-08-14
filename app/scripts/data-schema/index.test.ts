import { describe, expect, it } from 'vitest'
import { formatRootHelp } from './index'

describe('data-schema help', () => {
  it('lists the bun scripts', () => {
    const help = formatRootHelp()
    expect(help).toContain('data-schema-verify')
    expect(help).toContain('data-schema-pull')
    expect(help).toContain('data-schema-load')
    expect(help).toContain('data-schema-publish')
    expect(help).not.toContain('data-schema-import')
    expect(help).not.toContain('local load')
  })

  it('includes the shared big-picture section', () => {
    const help = formatRootHelp()
    expect(help).toContain('add-db-data-table')
    expect(help).toContain('/admin/data-schema')
    expect(help).toContain('Big picture — new table')
    expect(help).toContain('Big picture — existing table')
  })
})
