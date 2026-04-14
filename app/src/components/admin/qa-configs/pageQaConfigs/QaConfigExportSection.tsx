import { Link } from '@/components/shared/links/Link'
import { getQaConfigExportFilename } from '@/server/qa-configs/export/getQaConfigExportFilename'

type Props = {
  configId: number
  label: string
  slug: string
  mapTable: string
}

export function QaConfigExportSection({ configId, label, slug, mapTable }: Props) {
  const downloadFilename = getQaConfigExportFilename(slug)

  return (
    <section
      className="not-prose mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      aria-labelledby="qa-export-heading"
    >
      <h2 id="qa-export-heading" className="m-0 mb-3 text-lg font-semibold text-gray-900">
        Datenexport (CSV)
      </h2>
      <p className="mb-3 text-sm text-gray-600">
        Für die QA-Konfiguration <strong>„{label}“</strong> (Slug{' '}
        <code className="text-gray-800">{slug}</code>, Kartentabelle{' '}
        <code className="text-gray-800">{mapTable}</code>) enthält der Export eine Zeile pro
        QA-Bereich aus genau dieser Kartentabelle (Processing), sortiert nach Bereichs-ID. Pro Zeile
        werden die Metadaten dieser Konfiguration (ID, Slug, Tabellenname, Schwellenwerte), die
        Kennzahlen aus der Kartentabelle (Referenz- und Ist-Werte, Differenz, relative Werte), der
        geometrische Schwerpunkt (Breiten- und Längengrad, WGS84, gerundet) sowie die{' '}
        <strong>jeweils letzte Auswertung</strong> pro Bereich (nach Erstellungszeit) mit System-
        und Nutzerstatus, Evaluator-Typ, Zeitstempel (Europe/Berlin), Kommentar und Decision-Daten
        (JSON) ausgegeben. Zusätzlich erscheinen die Anzahl der gespeicherten Auswertungen pro
        Bereich, getrennt nach automatischer (SYSTEM) und manueller (USER) Bewertung.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/api/admin/qa-configs/${configId}/export-csv`}
          button
          download={downloadFilename}
        >
          CSV exportieren
        </Link>
      </div>
    </section>
  )
}
