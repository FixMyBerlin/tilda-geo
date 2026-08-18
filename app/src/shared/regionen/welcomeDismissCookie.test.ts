import { describe, expect, test } from 'vitest'
import {
  addWelcomeDismissedSlug,
  isWelcomeDismissedSlug,
  serializeWelcomeDismissedSlugs,
  WELCOME_DISMISSED_MAX_SLUGS,
  welcomeDismissedSlugsSchema,
} from './welcomeDismissCookie'

describe('welcomeDismissCookie', () => {
  test('parses and serializes comma-separated slugs', () => {
    expect(welcomeDismissedSlugsSchema.parse('radinfra,parkraum,radinfra')).toEqual([
      'radinfra',
      'parkraum',
    ])
    expect(serializeWelcomeDismissedSlugs(['radinfra', 'parkraum'])).toBe('radinfra,parkraum')
  })

  test('addWelcomeDismissedSlug appends and caps oldest', () => {
    expect(addWelcomeDismissedSlug('a,b', 'c')).toBe('a,b,c')
    expect(addWelcomeDismissedSlug('a,b', 'a')).toBe('b,a')

    const many = Array.from({ length: WELCOME_DISMISSED_MAX_SLUGS }, (_, i) => `r${i}`)
    const next = addWelcomeDismissedSlug(many.join(','), 'new')
    const parsed = welcomeDismissedSlugsSchema.parse(next)
    expect(parsed).toHaveLength(WELCOME_DISMISSED_MAX_SLUGS)
    expect(parsed[0]).toBe('r1')
    expect(parsed.at(-1)).toBe('new')
  })

  test('isWelcomeDismissedSlug', () => {
    expect(isWelcomeDismissedSlug('radinfra,parkraum', 'parkraum')).toBe(true)
    expect(isWelcomeDismissedSlug('radinfra', 'parkraum')).toBe(false)
  })
})
