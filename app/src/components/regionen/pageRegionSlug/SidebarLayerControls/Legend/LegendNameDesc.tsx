import { InformationCircleIcon } from '@heroicons/react/20/solid'
import type { FileMapDataSubcategoryStyleLegend } from '@/components/regionen/pageRegionSlug/mapData/types'
import { Markdown } from '@/components/shared/text/Markdown'

type Props = Pick<FileMapDataSubcategoryStyleLegend, 'name' | 'desc'>

export const LegendNameDesc = ({ name, desc }: Props) => {
  const wrapperClass =
    'min-w-0 flex-1 text-xs leading-tight font-normal text-gray-700 hyphens-auto wrap-anywhere'

  if (desc) {
    return (
      <div className={wrapperClass}>
        {/* Native `::marker` sits on its own line when the name is a long compound word. */}
        <details className="group">
          <summary className="flex cursor-pointer list-none flex-nowrap items-start gap-0.5 text-xs leading-tight marker:content-none [&::-webkit-details-marker]:hidden">
            <span
              className="min-w-0 wrap-anywhere hyphens-auto"
              lang="de"
              // oxlint-disable-next-line react/no-danger -- legend name from layer config
              dangerouslySetInnerHTML={{ __html: name }}
            />
            <InformationCircleIcon
              aria-hidden
              className="mt-px size-3 shrink-0 text-gray-300 group-open:text-gray-500 group-hover:text-gray-700"
            />
          </summary>
          {/* Border aligns with the color swatch (icon + gap left of the name). */}
          <ul className="-ml-5 border-l border-gray-300 pl-5 font-normal">
            {desc.map((descLine) => (
              <li
                className="list-disc py-0.5 pl-0.5 marker:text-gray-300 hover:marker:text-gray-300"
                key={descLine}
              >
                <Markdown
                  markdown={descLine}
                  className="prose-sm inline text-xs leading-tight text-inherit"
                />
              </li>
            ))}
          </ul>
        </details>
      </div>
    )
  }

  return (
    <div
      className={wrapperClass}
      lang="de"
      // oxlint-disable-next-line react/no-danger -- legend name from layer config
      dangerouslySetInnerHTML={{ __html: name }}
    />
  )
}
