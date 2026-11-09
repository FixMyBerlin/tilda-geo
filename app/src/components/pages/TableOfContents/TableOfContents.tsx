import { Link } from '@/components/shared/links/Link'
import type { TocHashLink } from './types'

/*
  We could make this more fancy…
  Here are few good articles.
  - https://blog.openreplay.com/creating-a-table-of-content-widget-in-react
    (and the full code https://codesandbox.io/s/infallible-borg-mqh9df?file=/src/App.tsx:877-963)
    This does not represent highrarcy well, it just intend the second level a bit more.
    Which is OK, since ATM we only have one level.
    Gotcha: The getId method does not work. And a renderToString from react-dom/server does not work with Intl well.
    However, we can just set the ids manually, I guess.
  - https://www.emgoto.com/react-table-of-contents/
    Handles the highrarchy better.
  - https://blog.eyas.sh/2022/03/react-toc/#user-content-fn-1
    Looks OK as well.
  - And then there is the version that is used in fixmy-frontend.
    Which derives the TOC by iterating over children AFAIK. Which IMO is more complexity than we need;
    all the solutions above just use a querySelector.
    */

/**
 * Shared shell for legal-page and dataset-docs TOCs (left rail; hidden below `lg`).
 * `w-44` fits words like "Verantwortlichkeit" and still ends before the centered text column at
 * 1024px; from `xl` on there is room for more.
 */
export const TABLE_OF_CONTENTS_NAV_CLASSNAME =
  'not-prose absolute top-28 z-10 hidden w-44 rounded bg-white px-4 py-3 lg:left-0 lg:block lg:rounded-l-none xl:fixed xl:w-56 xl:shadow-lg 2xl:left-8'

/** Long German words hyphenate (`lang="de"`) and break mid-word only when they still do not fit. */
export const TABLE_OF_CONTENTS_LINK_CLASSNAME =
  'block w-full min-w-0 py-1.5 leading-5 hyphens-auto wrap-break-word'

type Props = { items: TocHashLink }

export const TableOfContents = ({ items }: Props) => {
  return (
    <nav className={TABLE_OF_CONTENTS_NAV_CLASSNAME}>
      <ul>
        {items.map(([itemHash, itemlink]) => (
          <li key={itemHash}>
            <Link href={itemHash} className={TABLE_OF_CONTENTS_LINK_CLASSNAME}>
              {itemlink}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
