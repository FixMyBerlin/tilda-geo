import type { FileMapDataSubcategoryStyleLegend } from '@/components/regionen/pageRegionSlug/mapData/types'
import { Markdown } from '@/components/shared/text/Markdown'

type Props = Pick<FileMapDataSubcategoryStyleLegend, 'name' | 'desc'>

export const LegendNameDesc = ({ name, desc }: Props) => {
  const wrapperClass = 'text-sm leading-none font-normal text-gray-700 hyphens-auto'

  if (desc) {
    return (
      <div className={wrapperClass}>
        <details className="marker:text-gray-300 hover:marker:text-gray-700">
          <summary
            // `leading-none` matches the plain (descriptionless) legend rows above.
            className="cursor-pointer text-sm leading-none"
            // oxlint-disable-next-line react/no-danger -- legend name from layer config
            dangerouslySetInnerHTML={{ __html: name }}
          />
          {/* Flush-left on mobile (no nesting indent/border); keep the indent on desktop. */}
          <ul className="font-normal sm:ml-1 sm:border-l sm:border-gray-300 sm:pl-1.5">
            {desc.map((descLine) => (
              <li
                className="ml-[0.9rem] list-disc py-0.5 marker:text-gray-300 hover:marker:text-gray-300"
                key={descLine}
              >
                <Markdown
                  markdown={descLine}
                  className="prose-sm inline text-sm leading-tight text-inherit"
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
      // oxlint-disable-next-line react/no-danger -- legend name from layer config
      dangerouslySetInnerHTML={{ __html: name }}
    />
  )
}
