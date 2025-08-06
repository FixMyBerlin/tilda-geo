import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export function formatDate(date: Date | string | number | null | undefined): string {
  if (!date) return ''
  return format(new Date(date), 'dd.MM.yyyy', { locale: de })
}

export function formatDateTime(date: Date | string | number | null | undefined): string {
  if (!date) return ''
  return format(new Date(date), 'dd.MM.yyyy HH:mm', { locale: de })
}
