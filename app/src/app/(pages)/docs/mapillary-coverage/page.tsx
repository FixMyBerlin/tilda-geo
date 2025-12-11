import { formatDateTimeBerlin } from '@/src/app/_components/date/formatDateBerlin'
import { formatRelativeTime } from '@/src/app/_components/date/relativeTime'
import { Link } from '@/src/app/_components/links/Link'
import { getMapillaryCoverageMetadata } from '@/src/app/api/_util/getMapillaryCoverageMetadata'
import { Metadata } from 'next'
import 'server-only'

export const metadata: Metadata = {
  title: 'Mapillary Abdeckung',
  robots: 'noindex',
}

export default async function MapillaryCoveragePage() {
  const metadata = await getMapillaryCoverageMetadata()

  return (
    <>
      <h1>Mapillary Abdeckung</h1>

      <p>
        Diese Seite zeigt Informationen zur Mapillary-Abdeckung der Daten in TILDA. Mapillary ist
        ein Service für Straßenbilder, der verwendet wird, um Wege zu identifizieren, für die
        Bildmaterial verfügbar ist.
      </p>

      <h2>Letzte Aktualisierung</h2>

      {metadata ? (
        <div className="my-4">
          <table className="text-sm text-gray-500">
            <tbody>
              <tr>
                <th className="w-48 pr-4 align-top text-xs font-medium text-gray-900">
                  Mapillary-Daten:
                </th>
                <td className="pl-2">
                  <div>{formatDateTimeBerlin(metadata.ml_data_from)}</div>
                  <div className="text-xs text-gray-400">
                    ({formatRelativeTime(metadata.ml_data_from)})
                  </div>
                </td>
              </tr>
              <tr>
                <th className="w-48 pr-4 align-top text-xs font-medium text-gray-900">
                  OSM-Daten:
                </th>
                <td className="pl-2">
                  <div>{formatDateTimeBerlin(metadata.osm_data_from)}</div>
                  <div className="text-xs text-gray-400">
                    ({formatRelativeTime(metadata.osm_data_from)})
                  </div>
                </td>
              </tr>
              <tr>
                <th className="w-48 pr-4 align-top text-xs font-medium text-gray-900">
                  In TILDA aktualisiert am:
                </th>
                <td className="pl-2">
                  <div>{formatDateTimeBerlin(metadata.updated_at)}</div>
                  <div className="text-xs text-gray-400">
                    ({formatRelativeTime(metadata.updated_at)})
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">Keine Daten verfügbar.</p>
      )}

      <h2>Wie funktioniert die Mapillary-Abdeckung?</h2>

      <p>
        Der Abgleich mit Mapillary findet nur alle paar Wochen statt. Die Daten werden automatisch
        aktualisiert, wenn neue Mapillary-Sequenzen verfügbar sind.{' '}
        <Link href="https://radinfra.de/kampagne">Kampagnen auf radinfra.de</Link>, die
        Mapillary-Daten verwenden, enthalten nur Wege, für die Mapillary-Bilder erkannt wurden.
      </p>

      <p>
        Die Mapillary-Daten zeigen an, wann die Mapillary-Sequenzen verarbeitet wurden. Die
        OSM-Daten zeigen an, welchen Stand die OpenStreetMap-Daten hatten, die für den Abgleich
        verwendet wurden.
      </p>
    </>
  )
}
