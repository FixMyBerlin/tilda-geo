import { AdminIntro } from '@/components/admin/AdminIntro'
import { AdminFormSection } from '@/components/admin/aside/AdminFormSection'

type Props = {
  /** Section id for the jump list — usually `export`. */
  id: string
  title: string
  slug: string
  mapTable: string
}

/** Explains the CSV export; the download itself is the „CSV exportieren“ `AdminAsideLink`. */
export function QaConfigExportSection({ id, title, slug, mapTable }: Props) {
  return (
    <AdminFormSection
      id={id}
      title={title}
      description="Download über „CSV exportieren“ bei den Aktionen."
    >
      <AdminIntro>
        <p>
          Der Export enthält eine Zeile pro QA-Bereich aus der Kartentabelle <code>{mapTable}</code>
          , sortiert nach Bereichs-ID. Der Dateiname beginnt mit dem Slug <code>{slug}</code>.
        </p>
        <p>Pro Zeile:</p>
        <ul>
          <li>Metadaten dieser Konfiguration (ID, Slug, Tabellenname, Schwellenwerte)</li>
          <li>
            Kennzahlen aus der Kartentabelle (Referenz- und Ist-Werte, Differenz, relative Werte)
          </li>
          <li>geometrischer Schwerpunkt (Breiten- und Längengrad, WGS84, gerundet)</li>
          <li>
            die <strong>jeweils letzte Auswertung</strong> pro Bereich mit System- und Nutzerstatus,
            Evaluator-Typ, Zeitstempel (Europe/Berlin), Kommentar und Decision-Daten (JSON)
          </li>
          <li>Anzahl der Auswertungen pro Bereich, getrennt nach SYSTEM und USER</li>
        </ul>
      </AdminIntro>
    </AdminFormSection>
  )
}
