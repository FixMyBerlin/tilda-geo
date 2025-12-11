import { Markdown } from '@/src/app/_components/text/Markdown'
import { FileMapDataSubcategoryStyleLegend } from '../../../_mapData/types'

type Props = Pick<FileMapDataSubcategoryStyleLegend, 'name' | 'desc'>

export const LegendNameDesc = ({ name, desc }: Props) => {
  if (desc) {
    return (
      <div className="ml-2.5 flex items-center font-medium leading-none text-gray-700">
        <details className="marker:text-gray-300 hover:marker:text-gray-700">
          <summary className="cursor-pointer text-sm" dangerouslySetInnerHTML={{ __html: name }} />
          <ul className="mt-1 text-xs font-normal">
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
      className="ml-2.5 flex items-center text-sm font-medium leading-none text-gray-700"
      dangerouslySetInnerHTML={{ __html: name }}
    />
  )
}
