import {
  TABLE_OF_CONTENTS_LINK_CLASSNAME,
  TABLE_OF_CONTENTS_NAV_CLASSNAME,
} from '@/components/pages/TableOfContents/TableOfContents'
import { Link } from '@/components/shared/links/Link'
import { Markdown } from '@/components/shared/text/Markdown'
import type { TopicDocCompiled } from '@/data/topicDocs/runtime'
import { DOCS_PAGE_SECTION_IDS } from './docsSectionIds.const'

type Props = {
  topicDoc: TopicDocCompiled | null
  tableName: string
  regionSlug: string | null
  showDownloads: boolean
}

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
              className={TABLE_OF_CONTENTS_LINK_CLASSNAME}
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
            className={TABLE_OF_CONTENTS_LINK_CLASSNAME}
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
            className={TABLE_OF_CONTENTS_LINK_CLASSNAME}
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
              className={TABLE_OF_CONTENTS_LINK_CLASSNAME}
            >
              <Markdown markdown={chapter.title} inline />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
