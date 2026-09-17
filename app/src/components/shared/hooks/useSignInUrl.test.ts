import { describe, expect, test } from 'vitest'
import { getSafeSignInCallbackURL } from './useSignInUrl'

describe('getSafeSignInCallbackURL', () => {
  test('keeps relative path and search', () => {
    expect(getSafeSignInCallbackURL('/regionen/foo/qa?map=14/52.5/13.4')).toBe(
      '/regionen/foo/qa?map=14/52.5/13.4',
    )
  })

  test('reduces absolute URLs to path and search', () => {
    expect(getSafeSignInCallbackURL('https://evil.example/regionen/foo?map=1')).toBe(
      '/regionen/foo?map=1',
    )
  })

  test('rejects protocol-relative, api, and oauth error paths', () => {
    expect(getSafeSignInCallbackURL('//evil.example/regionen/foo')).toBe('/')
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
