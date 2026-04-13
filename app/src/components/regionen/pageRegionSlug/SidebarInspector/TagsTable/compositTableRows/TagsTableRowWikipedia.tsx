import { Link } from '@/components/shared/links/Link'
import { TagsTableRow } from '../TagsTableRow'
import type { CompositTableRow } from './types'

export const tableKeyWikipedia = 'wikipedia'
export const TagsTableRowWikipedia = ({ sourceId, tagKey, properties }: CompositTableRow) => {
  if (!properties.wikipeida) return null

  return (
    <TagsTableRow key={tagKey} sourceId={sourceId} tagKey={tagKey}>
      <Link blank href={`https://de.wikipedia.org/wiki/${properties.wikipeida}`}>
        {properties.wikipeida}
      </Link>
    </TagsTableRow>
  )
}
