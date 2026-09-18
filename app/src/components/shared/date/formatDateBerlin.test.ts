import { describe, expect, it } from 'vitest'
import {
  formatDateBerlin,
  formatDateTimeBerlin,
  formatDateTimeBerlinWithWeekday,
} from './formatDateBerlin'

describe('formatDateBerlin', () => {
  it('formats with an arbitrary format string in Berlin time', () => {
    // 2026-08-13T08:00:00Z is 10:00 in Berlin (CEST, UTC+2)
    expect(formatDateBerlin('2026-08-13T08:00:00Z', 'yyyy-MM-dd HH:mm')).toBe('2026-08-13 10:00')
  })

  it('formats date and time without a weekday', () => {
    expect(formatDateTimeBerlin('2026-08-13T08:00:00Z')).toBe('13.08.2026 10:00')
  })

  it('formats date and time with the short German weekday (e.g. "Mo")', () => {
    // 2026-08-13 is a Thursday
    expect(formatDateTimeBerlinWithWeekday('2026-08-13T08:00:00Z')).toBe('Do, 13.08.2026 10:00')
    // 2026-09-14 is a Monday
    expect(formatDateTimeBerlinWithWeekday('2026-09-14T08:00:00Z')).toBe('Mo, 14.09.2026 10:00')
  })

  it('does not depend on the local system timezone', () => {
    // A UTC midnight timestamp still lands on the next Berlin calendar day (CEST, UTC+2)
    expect(formatDateTimeBerlinWithWeekday('2026-09-14T23:30:00Z')).toBe('Di, 15.09.2026 01:30')
  })
})
