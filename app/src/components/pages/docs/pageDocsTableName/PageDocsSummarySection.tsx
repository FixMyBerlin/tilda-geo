import { CopyButton } from '@/components/shared/CopyButton'
import { Link } from '@/components/shared/links/Link'
import {
  TILDA_DATASET_ATTRIBUTION_HTML,
  TILDA_DATASET_LICENSE,
} from '@/data/topicDocs/topicDocsDatasetAttribution.const'
import type { DocsPageSummaryProps } from './types'

export const PageDocsSummarySection = ({
  tableName,
  groupDocs,
  regionSlug,
}: DocsPageSummaryProps) => {
  const relatedGroupDocs = groupDocs.filter((d) => d.tableName !== tableName)

  return (
    <section>
      <table className="my-2 w-full table-fixed text-sm text-gray-500">
        <colgroup>
          <col className="w-[40%]" />
          <col className="w-[60%]" />
        </colgroup>
        <tbody>
          <tr>
            <th className="py-0.5 pr-2 align-middle font-medium whitespace-normal text-gray-900 lg:whitespace-nowrap">
              Attribution
            </th>
            <td className="min-w-0 py-0.5 align-middle wrap-break-word">
              <div className="not-prose flex items-center gap-2">
                <div
                  className="min-w-0 flex-1 text-sm text-gray-500 [&_a]:underline"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: static OSM/TILDA attribution HTML
                  dangerouslySetInnerHTML={{ __html: TILDA_DATASET_ATTRIBUTION_HTML }}
                />
                <div className="shrink-0 print:hidden">
                  <CopyButton
                    toCopy={TILDA_DATASET_ATTRIBUTION_HTML}
                    asHtml
                    label="HTML kopieren"
                  />
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <th className="py-0.5 pr-2 align-middle font-medium whitespace-normal text-gray-900 lg:whitespace-nowrap">
              Lizenz
            </th>
            <td className="min-w-0 py-0.5 align-middle wrap-break-word">{TILDA_DATASET_LICENSE}</td>
          </tr>
          <tr>
            <th className="py-0.5 pr-2 align-middle font-medium whitespace-normal text-gray-900 lg:whitespace-nowrap">
              Technischer Name
            </th>
            <td className="min-w-0 py-0.5 align-middle wrap-break-word">
              <code>{tableName}</code>
            </td>
          </tr>
          <tr>
            <th className="py-0.5 pr-2 align-middle font-medium whitespace-normal text-gray-900 lg:whitespace-nowrap">
              Projektion
            </th>
            <td className="min-w-0 py-0.5 align-middle wrap-break-word">EPSG:4326 (WGS84)</td>
          </tr>
          {relatedGroupDocs.length > 0 ? (
            <tr className="print:hidden">
              <th className="py-0.5 pr-2 align-middle font-medium whitespace-normal text-gray-900 lg:whitespace-nowrap">
                Verwandte Datensätze
              </th>
              <td className="min-w-0 py-0.5 align-middle wrap-break-word">
                <div className="not-prose text-sm text-gray-500">
                  {relatedGroupDocs.map((groupDoc, index) => (
                    <span key={groupDoc.tableName}>
                      {index > 0 ? <span className="text-gray-400">, </span> : null}
                      <Link
                        to="/docs/$tableName"
                        params={{ tableName: groupDoc.tableName }}
                        search={{ r: regionSlug ?? undefined }}
                      >
                        {groupDoc.topicDoc?.title ?? groupDoc.tableName}
                      </Link>
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  )
}
