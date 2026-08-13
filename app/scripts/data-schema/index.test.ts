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
})
