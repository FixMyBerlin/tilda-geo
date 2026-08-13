import { describe, expect, it } from 'vitest'
import { formatRootHelp } from './index'

describe('data-schema help', () => {
  it('lists the three bun scripts', () => {
    const help = formatRootHelp()
    expect(help).toContain('data-schema-sync')
    expect(help).toContain('data-schema-load')
    expect(help).toContain('data-schema-publish')
    expect(help).not.toContain('local load')
  })
})
