import { getRouteApi } from '@tanstack/react-router'
import { LinkMail } from '@/components/shared/links/LinkMail'
import { Markdown } from '@/components/shared/text/Markdown'
import { PageDocsAttributesSection } from './pageDocsTableName/PageDocsAttributesSection'
import { PageDocsChaptersSection } from './pageDocsTableName/PageDocsChaptersSection'
import { PageDocsMasterportalSection } from './pageDocsTableName/PageDocsMasterportalSection'
import { PageDocsRegionAccessSection } from './pageDocsTableName/PageDocsRegionAccessSection'
import { PageDocsSummarySection } from './pageDocsTableName/PageDocsSummarySection'
import { PageDocsTocSection } from './pageDocsTableName/PageDocsTocSection'

const routeApi = getRouteApi('/_pages/docs/$tableName')

export function PageDocsTableName() {
  const { tableName, regionSlug, region, topicDoc, masterportal, groupDocs } =
    routeApi.useLoaderData()

  return (
    <>
      <h1>
        Dokumentation für den Datensatz{' '}
        {topicDoc?.title ? (
          <>«{topicDoc.title}»</>
        ) : (
          <>
            «<code>{tableName}</code>»
          </>
        )}
      </h1>

      {topicDoc?.summary ? (
        <Markdown markdown={topicDoc.summary} className="lead mt-2 mb-8 max-w-none text-gray-600" />
      ) : null}

      <PageDocsSummarySection tableName={tableName} groupDocs={groupDocs} regionSlug={regionSlug} />

      {region && regionSlug ? (
        <PageDocsRegionAccessSection
          region={region}
          regionSlug={regionSlug}
          tableName={tableName}
        />
      ) : null}

      {!topicDoc && (
        <p>
          Für diese Tabelle liegt noch keine strukturierte Dokumentation vor. Bei Fragen wenden Sie
          sich bitte an <LinkMail>tilda@fixmycity.de</LinkMail>
        </p>
      )}

      {topicDoc && (
        <>
          <PageDocsTocSection
            topicDoc={topicDoc}
            tableName={tableName}
            regionSlug={regionSlug}
            showDownloads={Boolean(region?.bbox)}
          />
          <PageDocsAttributesSection
            topicDoc={topicDoc}
            tableName={tableName}
            regionSlug={regionSlug}
          />
          <PageDocsMasterportalSection masterportal={masterportal} />
          <PageDocsChaptersSection topicDoc={topicDoc} />
        </>
      )}
    </>
  )
}
