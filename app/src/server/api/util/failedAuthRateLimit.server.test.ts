import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  failedAuthRateLimitKey,
  isFailedAuthRateLimited,
  recordFailedAuth,
  resetFailedAuthRateLimits,
} from './failedAuthRateLimit.server'

const request = (headers: Record<string, string> = {}) =>
  new Request('https://tilda-geo.de/api/x', { headers })

let warn: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  resetFailedAuthRateLimits()
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => warn.mockRestore())

describe('failedAuthRateLimitKey', () => {
  test('one key per prefix and client IP: the rightmost X-Forwarded-For hop', () => {
    expect(failedAuthRateLimitKey(request({ 'X-Forwarded-For': '203.0.113.5' }), 'a')).toBe(
      'a:203.0.113.5',
    )
    expect(
      failedAuthRateLimitKey(request({ 'X-Forwarded-For': '1.1.1.1, 203.0.113.5' }), 'a'),
    ).toBe('a:203.0.113.5')
    expect(failedAuthRateLimitKey(request({ 'X-Real-IP': '198.51.100.7' }), 'b')).toBe(
      'b:198.51.100.7',
    )
  })

  test('two IPs have separate buckets, a prefix has its own', () => {
    const first = failedAuthRateLimitKey(request({ 'X-Forwarded-For': '203.0.113.5' }), 'a')!
    const second = failedAuthRateLimitKey(request({ 'X-Forwarded-For': '198.51.100.7' }), 'a')!
    const other = failedAuthRateLimitKey(request({ 'X-Forwarded-For': '203.0.113.5' }), 'b')!
    for (let attempt = 0; attempt < 20; attempt++) recordFailedAuth(first)

    expect(isFailedAuthRateLimited(first)).toBe(true)
    expect(isFailedAuthRateLimited(second)).toBe(false)
    expect(isFailedAuthRateLimited(other)).toBe(false)
  })

  test('without an IP header there is no key, and the warning is logged once', () => {
    expect(failedAuthRateLimitKey(request(), 'a')).toBeNull()
    expect(failedAuthRateLimitKey(request(), 'b')).toBeNull()

    expect(warn).toHaveBeenCalledTimes(1)
  })
})
