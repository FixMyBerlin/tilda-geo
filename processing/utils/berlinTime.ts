import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'

/**
 * Get a Berlin timezone formatted string for logging
 */
export const berlinTimeString = (dateTime: Date) => {
  const berlinDate = new TZDate(dateTime, 'Europe/Berlin')
  return format(berlinDate, 'dd.MM.yyyy HH:mm:ss')
}
