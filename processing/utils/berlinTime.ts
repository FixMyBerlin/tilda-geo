import { TZDate } from '@date-fns/tz'
import { format, getDay } from 'date-fns'

/**
 * Get a Berlin timezone formatted string for logging
 */
export const berlinTimeString = (dateTime: Date) => {
  const berlinDate = new TZDate(dateTime, 'Europe/Berlin')
  return format(berlinDate, 'dd.MM.yyyy HH:mm:ss')
}

/**
 * True when `dateTime` falls on a Saturday in Berlin time.
 * Used to decide whether `schedule: 'weekend'` topics run on this nightly run (~once a week).
 */
export const isBerlinSaturday = (dateTime: Date) => {
  const day = getDay(new TZDate(dateTime, 'Europe/Berlin')) // 0 = Sunday … 6 = Saturday
  return day === 6
}
