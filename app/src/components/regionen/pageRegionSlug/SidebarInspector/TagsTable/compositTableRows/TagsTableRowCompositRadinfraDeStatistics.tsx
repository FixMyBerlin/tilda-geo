import { Link } from '@/components/shared/links/Link'
import type { CompositTableRow } from './types'

export const tableKeyRadinfraDeStatistics = 'atlas_aggregated_lengths'
export const TagsTableRowCompositRadinfraDeStatistics = ({
  properties: _properties,
}: Pick<CompositTableRow, 'properties'>) => {
  const url = 'https://radinfra.de/statistik/'

  return (
    <div className="flex items-center justify-center p-10">
      <Link href={url} blank button>
        Statistik Details auf radinfra.de anzeigen
      </Link>
    </div>
  )
}
