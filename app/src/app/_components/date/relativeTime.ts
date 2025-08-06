import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

export function formatRelativeTime(date: Date | string | number | null | undefined): string {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { locale: de, addSuffix: true })
}
