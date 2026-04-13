import { TABLE_OF_CONTENTS_NAV_CLASSNAME } from '@/components/pages/TableOfContents/TableOfContents'
import { Link } from '@/components/shared/links/Link'
import { DOCS_PAGE_SECTION_IDS } from './docsSectionIds.const'
import type { DocsPageTopicDoc } from './types'

type Props = {
  topicDoc: DocsPageTopicDoc
  tableName: string
  regionSlug: string | null
  showDownloads: boolean
}

const tocLinkClassName =
  'block w-full min-w-0 py-1.5 leading-5 hyphens-auto [overflow-wrap:anywhere]'

export const PageDocsTocSection = ({ topicDoc, tableName, regionSlug, showDownloads }: Props) => {
  if (!topicDoc) return null

  const search = { r: regionSlug ?? undefined }

  return (
    <nav aria-label="Inhaltsverzeichnis" className={TABLE_OF_CONTENTS_NAV_CLASSNAME}>
      <ul>
        {showDownloads ? (
          <li key={DOCS_PAGE_SECTION_IDS.downloads}>
            <Link
              to="/docs/$tableName"
              params={{ tableName }}
              search={search}
              hash={DOCS_PAGE_SECTION_IDS.downloads}
              className={tocLinkClassName}
            >
              Downloads
            </Link>
          </li>
        ) : null}
        <li key={DOCS_PAGE_SECTION_IDS.attributtabelle}>
          <Link
            to="/docs/$tableName"
            params={{ tableName }}
            search={search}
            hash={DOCS_PAGE_SECTION_IDS.attributtabelle}
            className={tocLinkClassName}
          >
            Attributtabelle
          </Link>
        </li>
        <li key={DOCS_PAGE_SECTION_IDS.masterportal}>
          <Link
            to="/docs/$tableName"
            params={{ tableName }}
            search={search}
            hash={DOCS_PAGE_SECTION_IDS.masterportal}
            className={tocLinkClassName}
          >
            Masterportal
          </Link>
        </li>
        {topicDoc.chapters.map((chapter) => (
          <li key={chapter.id}>
            <Link
              to="/docs/$tableName"
              params={{ tableName }}
              search={search}
              hash={chapter.id}
              className={tocLinkClassName}
            >
              {chapter.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
