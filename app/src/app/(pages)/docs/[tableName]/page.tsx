import { Link } from '@/src/app/_components/links/Link'
import { LinkMail } from '@/src/app/_components/links/LinkMail'
import { exportApiIdentifier } from '@/src/app/regionen/[regionSlug]/_mapData/mapDataSources/export/exportIdentifier'
import { sources } from '@/src/app/regionen/[regionSlug]/_mapData/mapDataSources/sources.const'
import { Metadata, Route } from 'next'
import { notFound } from 'next/navigation'
import { z } from 'zod'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tableName: string }>
}): Promise<Metadata> {
  const { tableName: tableNameParam } = await params
  const tableNameSchema = z.enum(exportApiIdentifier)
  const parsed = tableNameSchema.safeParse(tableNameParam)

  if (!parsed.success) {
    return {
      title: 'Datensatz nicht gefunden',
    }
  }

  const source = sources.find((s) => s.export?.enabled && s.export?.apiIdentifier === parsed.data)

  return {
    robots: 'noindex',
    title: source?.export?.title
      ? `Dokumentation für ${source.export.title}`
      : `Dokumentation für Datensatz ${parsed.data}`,
  }
}

type Props = {
  params: Promise<{ tableName: string }>
  searchParams: Promise<{ r?: string }>
}

export default async function DocsPage({ params, searchParams }: Props) {
  const { tableName: tableNameParam } = await params
  const { r: regionSlug } = await searchParams
  const tableNameSchema = z.enum(exportApiIdentifier)
  const parsed = tableNameSchema.safeParse(tableNameParam)
  if (!parsed.success) {
    notFound()
  }

  const tableName = parsed.data
  // Find source data by export.apiIdentifier
  const source = sources.find((s) => s.export?.enabled && s.export?.apiIdentifier === tableName)

  return (
    <>
      <h1>
        Dokumentation für Datensatz <code>{tableName}</code>
      </h1>

      {source?.export?.title && <h2>{source.export.title}</h2>}

      {source && (
        <table className="my-2 text-sm text-gray-500">
          <tbody>
            {source.export.desc && (
              <tr>
                <th className="w-24 align-top text-xs font-medium text-gray-900">Beschreibung:</th>
                <td className="pl-2">{source.export.desc}</td>
              </tr>
            )}
            {source.attributionHtml && source.attributionHtml !== 'todo' && (
              <tr>
                <th className="w-24 align-top text-xs font-medium text-gray-900">Attribution:</th>
                <td
                  className="pl-2"
                  dangerouslySetInnerHTML={{
                    __html: source.attributionHtml,
                  }}
                />
              </tr>
            )}
            {source.licence && (
              <tr>
                <th className="w-24 align-top text-xs font-medium text-gray-900">Lizenz:</th>
                <td className="pl-2">{source.licence}</td>
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
          <Link href={`/regionen/${regionSlug}` as Route} button>
            Zur Region
          </Link>
        </p>
      )}
    </>
  )
}
