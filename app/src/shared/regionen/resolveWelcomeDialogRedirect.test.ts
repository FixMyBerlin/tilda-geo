import { describe, expect, test } from 'vitest'
import { resolveWelcomeDialogRedirectUrl } from './resolveWelcomeDialogRedirect'

const publicWelcomeRegion = {
  slug: 'radinfra',
  status: 'PUBLIC',
  welcome: { enabled: true },
}

describe('resolveWelcomeDialogRedirectUrl', () => {
  test('adds dialog=welcome when eligible', () => {
    const href = resolveWelcomeDialogRedirectUrl({
      url: 'http://127.0.0.1:5173/regionen/radinfra?map=1/2/3',
      region: publicWelcomeRegion,
      dismissedCookie: undefined,
    })
    expect(href).toContain('dialog=welcome')
    expect(href).toContain('map=1%2F2%2F3')
  })

  test('skips when already open, skipped, dismissed, or not public welcome', () => {
    expect(
      resolveWelcomeDialogRedirectUrl({
        url: 'http://127.0.0.1:5173/regionen/radinfra?dialog=welcome',
        region: publicWelcomeRegion,
        dismissedCookie: undefined,
      }),
    ).toBeNull()

    expect(
      resolveWelcomeDialogRedirectUrl({
        url: 'http://127.0.0.1:5173/regionen/radinfra?__skipDialog=welcome',
        region: publicWelcomeRegion,
        dismissedCookie: undefined,
      }),
    ).toBeNull()

    expect(
      resolveWelcomeDialogRedirectUrl({
        url: 'http://127.0.0.1:5173/regionen/radinfra',
        region: publicWelcomeRegion,
        dismissedCookie: 'radinfra',
      }),
    ).toBeNull()

    expect(
      resolveWelcomeDialogRedirectUrl({
        url: 'http://127.0.0.1:5173/regionen/radinfra',
        region: { ...publicWelcomeRegion, status: 'PRIVATE' },
        dismissedCookie: undefined,
      }),
    ).toBeNull()

    expect(
      resolveWelcomeDialogRedirectUrl({
        url: 'http://127.0.0.1:5173/regionen/radinfra',
        region: { ...publicWelcomeRegion, welcome: null },
        dismissedCookie: undefined,
      }),
    ).toBeNull()
  })
})
