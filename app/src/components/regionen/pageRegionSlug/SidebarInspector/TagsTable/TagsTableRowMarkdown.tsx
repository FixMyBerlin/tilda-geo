import { twJoin } from 'tailwind-merge'
import type { SourcesId } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sources.const'
import { MarkdownAttributeValue } from '@/components/shared/text/MarkdownAttributeValue'
import { tagsTableLeadingClass } from './tagsTableLayout'
import { TagsTableRow } from './TagsTableRow'

type Props = {
  sourceId: SourcesId | string
  tagKey: string
  markdown: string
}

/** Row for `*_markdown` attributes (see `parseMarkdownKey`). */
export const TagsTableRowMarkdown = ({ sourceId, tagKey, markdown }: Props) => (
  <TagsTableRow sourceId={sourceId} tagKey={tagKey}>
    <MarkdownAttributeValue
      markdown={markdown}
      className={twJoin('text-sm text-inherit prose-code:text-inherit', tagsTableLeadingClass)}
    />
  </TagsTableRow>
)
