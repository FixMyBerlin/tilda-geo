import { describe, expect, it } from 'vitest'
import { decidePublishMode, formatLatestAge, isLatestStale } from './publishMode'

const now = new Date('2026-08-13T10:00:00Z')

describe('isLatestStale', () => {
  it('is false under 24 hours', () => {
    expect(isLatestStale('2026-08-12T11:00:00Z', now)).toBe(false)
  })

  it('is true at 24 hours', () => {
    expect(isLatestStale('2026-08-12T10:00:00Z', now)).toBe(true)
  })

  it('is false for an unparsable timestamp', () => {
    expect(isLatestStale('not-a-date', now)).toBe(false)
  })
})

describe('formatLatestAge', () => {
  it('uses hours under one day', () => {
    expect(formatLatestAge('2026-08-13T04:00:00Z', now)).toBe('6 hours ago')
  })

  it('uses days at or above one day', () => {
    expect(formatLatestAge('2026-08-11T10:00:00Z', now)).toBe('2 days ago')
    expect(formatLatestAge('2026-08-12T10:00:00Z', now)).toBe('1 day ago')
  })
})

describe('decidePublishMode', () => {
  it('honours an explicit mode and never prompts', () => {
    expect(
      decidePublishMode({
        explicitMode: 'override',
        previousPublishedAt: '2026-01-01T00:00:00Z',
        now,
      }),
    ).toEqual({ mode: 'override', prompt: false })
    expect(
      decidePublishMode({
        explicitMode: 'snapshot',
        previousPublishedAt: null,
        now,
      }),
    ).toEqual({ mode: 'snapshot', prompt: false })
  })

  it('overrides without prompting when there is no previous latest', () => {
    expect(decidePublishMode({ explicitMode: undefined, previousPublishedAt: null, now })).toEqual({
      mode: 'override',
      prompt: false,
    })
  })

  it('overrides without prompting when latest is fresh', () => {
    expect(
      decidePublishMode({
        explicitMode: undefined,
        previousPublishedAt: '2026-08-13T08:00:00Z',
        now,
      }),
    ).toEqual({ mode: 'override', prompt: false })
  })

  it('prompts with snapshot as the default when latest is stale', () => {
    expect(
      decidePublishMode({
        explicitMode: undefined,
        previousPublishedAt: '2026-08-01T00:00:00Z',
        now,
      }),
    ).toEqual({ mode: 'snapshot', prompt: true })
  })
})
