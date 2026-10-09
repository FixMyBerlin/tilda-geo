import { inheritLinkStyles } from '@/components/shared/links/styles'
import { Markdown } from '@/components/shared/text/Markdown'
import type { ReviewEntryDisplayProperties } from '@/shared/reviewLists/reviewEntryImport'
import { parseReviewEntryPropertyKey } from './reviewEntryMarkdownKey'
import { SvgMarkdown } from './SvgMarkdown'

type Props = { properties: ReviewEntryDisplayProperties }

/** "Attribute des Eintrags": headline plus key/value list; renders nothing without attributes. */
export const ReviewEntryProperties = ({ properties }: Props) => {
  const entries = Object.entries(properties)
  if (entries.length === 0) return null

  return (
    <div>
      <h3 className="mb-1.5 text-xs font-medium text-gray-900">Attribute des Eintrags</h3>
      <dl className="divide-y divide-gray-950/10 overflow-hidden rounded-md border border-gray-950/10 text-xs">
        {entries.map(([key, value]) => {
          const { label, isMarkdown } = parseReviewEntryPropertyKey(key)
          return (
            <div
              key={key}
              className="grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)] items-baseline gap-x-2 px-2.5 py-1.5"
            >
              <dt className="flex min-w-0 items-center gap-1 font-medium text-gray-500">
                <span className="truncate" title={label}>
                  {label}
                </span>
                {isMarkdown ? <SvgMarkdown className="size-3.5 shrink-0" /> : null}
              </dt>
              {isMarkdown ? (
                <dd className="min-w-0">
                  <Markdown
                    markdown={value}
                    className="text-xs leading-normal wrap-anywhere text-gray-900 prose-p:my-1 prose-ol:my-1 prose-ul:my-1 prose-li:my-0 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                    linkClassNameOverwrite={inheritLinkStyles}
                  />
                </dd>
              ) : (
                <dd className="truncate text-gray-900" title={value}>
                  {value}
                </dd>
              )}
            </div>
          )
        })}
      </dl>
    </div>
  )
}
