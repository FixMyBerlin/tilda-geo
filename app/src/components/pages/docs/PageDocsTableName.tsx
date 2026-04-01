import { getRouteApi } from '@tanstack/react-router'
import { Link } from '@/components/shared/links/Link'
import { LinkMail } from '@/components/shared/links/LinkMail'

const routeApi = getRouteApi('/_pages/docs/$tableName')

export function PageDocsTableName() {
  const { tableName, exportData, regionSlug } = routeApi.useLoaderData()

  return (
    <>
      <h1>
        Dokumentation für Datensatz <code>{tableName}</code>
      </h1>

      {exportData?.title && <h2>{exportData.title}</h2>}

      {exportData && (
        <table className="my-2 text-sm text-gray-500">
          <tbody>
            {exportData.desc && (
              <tr>
                <th className="w-24 align-top text-xs font-medium text-gray-900">Beschreibung:</th>
                <td className="pl-2">{exportData.desc}</td>
              </tr>
            )}
            {exportData.attributionHtml && exportData.attributionHtml !== 'todo' && (
              <tr>
                <th className="w-24 align-top text-xs font-medium text-gray-900">Attribution:</th>
                <td
                  className="pl-2"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: attribution HTML from dataset config
                  dangerouslySetInnerHTML={{
                    __html: exportData.attributionHtml,
                  }}
                />
              </tr>
            )}
            {exportData.licence && (
              <tr>
                <th className="w-24 align-top text-xs font-medium text-gray-900">Lizenz:</th>
                <td className="pl-2">{exportData.licence}</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <p>
        Zur Zeit gibt es noch keine öffentliche Dokumentation für diesen Datensatz. Bei Fragen
        wenden Sie sich bitte an <LinkMail>tilda@fixmycity.de</LinkMail>
      </p>

      {regionSlug && (
        <p>
          <Link to="/regionen/$regionSlug" params={{ regionSlug }} button>
            Zur Region
          </Link>
        </p>
      )}
    </>
  )
}
