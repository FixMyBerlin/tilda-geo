import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

const BERLIN_TIMEZONE = 'Europe/Berlin'

/**
 * Format a date in Berlin timezone with German locale
 */
export function formatDateBerlin(date: Date | string | number, formatStr: string) {
  const berlinDate = new TZDate(new Date(date), BERLIN_TIMEZONE)
  return format(berlinDate, formatStr, { locale: de })
}

/**
 * Format a date and time in Berlin timezone with German locale
 */
export function formatDateTimeBerlin(date: Date | string | number) {
  return formatDateBerlin(date, 'dd.MM.yyyy HH:mm')
}

/**
 * Format a date and time in Berlin timezone with German locale, including the weekday
 * (e.g. "Mo, 08.09.2026 14:03").
 */
export function formatDateTimeBerlinWithWeekday(date: Date | string | number) {
  return formatDateBerlin(date, 'EEEEEE, dd.MM.yyyy HH:mm')
}
