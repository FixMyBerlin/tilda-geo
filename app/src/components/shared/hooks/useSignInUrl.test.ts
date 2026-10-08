import { describe, expect, test } from 'vitest'
import { getSafeSignInCallbackURL } from '@/shared/auth/safeSignInCallbackURL'

describe('getSafeSignInCallbackURL', () => {
  test('keeps relative path and search', () => {
    expect(getSafeSignInCallbackURL('/regionen/foo/qa?v=3&config=a.b')).toBe(
      '/regionen/foo/qa?v=3&config=a.b',
    )
    expect(getSafeSignInCallbackURL('/regionen/foo')).toBe('/regionen/foo')
  })

  test('encodes what the Better Auth allowlist rejects', () => {
    const betterAuthRelativeCallback = /^\/(?!\/|\\|%2f|%5c)[\w\-.+/@]*(?:\?[\w\-.+/=&%@]*)?$/
    const safe = getSafeSignInCallbackURL(
      '/regionen/foo?map=14/52.5/13.4&data=[]&f=1,2&draw=!(id~*03d2~coordinates~!!13.4~52.4)~',
    )
    expect(safe).toMatch(betterAuthRelativeCallback)
    expect(safe).toContain('draw=%21%28id%7E%2A03d2')
    // Encoding twice changes nothing, so the sign-in route can pass the value through again.
    expect(getSafeSignInCallbackURL(safe)).toBe(safe)
  })

  test('reduces absolute URLs to path and search', () => {
    expect(getSafeSignInCallbackURL('https://evil.example/regionen/foo?map=1')).toBe(
      '/regionen/foo?map=1',
    )
  })

  test('rejects protocol-relative, api, and oauth error paths', () => {
    expect(getSafeSignInCallbackURL('//evil.example/regionen/foo')).toBe('/')
    expect(getSafeSignInCallbackURL('/api/foo')).toBe('/')
    expect(getSafeSignInCallbackURL('/api/sign-in')).toBe('/')
    expect(getSafeSignInCallbackURL('/api/auth/callback')).toBe('/')
    expect(getSafeSignInCallbackURL('/oautherror?error=x')).toBe('/')
    expect(getSafeSignInCallbackURL('/OAuthError')).toBe('/')
  })

  test('falls back when empty', () => {
    expect(getSafeSignInCallbackURL(undefined)).toBe('/')
    expect(getSafeSignInCallbackURL('   ')).toBe('/')
  })
})
