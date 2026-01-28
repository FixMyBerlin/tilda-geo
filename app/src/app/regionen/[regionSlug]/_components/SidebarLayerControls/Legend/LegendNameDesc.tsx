import { Markdown } from '@/src/app/_components/text/Markdown'
import { FileMapDataSubcategoryStyleLegend } from '../../../_mapData/types'

type Props = Pick<FileMapDataSubcategoryStyleLegend, 'name' | 'desc'>

export const LegendNameDesc = ({ name, desc }: Props) => {
  const wrapperClass = 'text-sm leading-none font-normal text-gray-700 hyphens-auto'

  if (desc) {
    return (
      <div className={wrapperClass}>
        <details className="marker:text-gray-300 hover:marker:text-gray-700">
          <summary className="cursor-pointer text-sm" dangerouslySetInnerHTML={{ __html: name }} />
          <ul className="ml-1 border-l border-gray-300 pl-1.5 font-normal">
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

  return <div className={wrapperClass} dangerouslySetInnerHTML={{ __html: name }} />
}
