import { Link } from '@/components/shared/links/Link'
import { TagsTableRow } from '../TagsTableRow'
import type { CompositTableRow } from './types'

export const tableKeyWebsite = 'website'
export const TagsTableRowWebsite = ({ sourceId, tagKey, properties }: CompositTableRow) => {
  if (!properties[tagKey]) return null

  return (
    <TagsTableRow key={tagKey} sourceId={sourceId} tagKey={tagKey}>
      <Link blank href={properties[tagKey]}>
        {properties[tagKey].replace('https://', '').replace('http://', '')}
      </Link>
    </TagsTableRow>
  )
}
