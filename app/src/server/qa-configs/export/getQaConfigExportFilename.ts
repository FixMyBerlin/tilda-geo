import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'
import slugify from 'slugify'

export function getQaConfigExportFilename(slug: string) {
  const dayStamp = format(new TZDate(new Date(), 'Europe/Berlin'), 'yyyy-MM-dd')
  const safe = slugify(slug, { lower: true, strict: true }) || 'export'
  return `qa-${safe}-${dayStamp}.csv`
}
