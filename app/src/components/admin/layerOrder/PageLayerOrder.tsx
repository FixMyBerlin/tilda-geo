import { AdminIntro } from '@/components/admin/AdminIntro'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminLayerOrder } from './AdminLayerOrder'

export function PageLayerOrder() {
  return (
    <>
      <AdminPageHeader
        title="Karten-Layer-Reihenfolge"
        intro={
          <AdminIntro>
            <p>
              Die Liste zeigt die Karte von oben nach unten: Was hier weiter oben steht, liegt auf
              der Karte über dem, was darunter steht. Die grauen Zeilen sind Ebenen der
              Hintergrundkarte, dazwischen liegen die Positionen für die TILDA-Layer.
            </p>
            <ul>
              <li>
                <strong>Reihenfolge an einer Position:</strong> Layer am Griff ziehen.
              </li>
              <li>
                <strong>Andere Position:</strong> im Auswahlfeld wählen, zum Beispiel „Unter den
                Straßennamen“. „Standard“ ist die Position aus dem Code.
              </li>
              <li>
                <strong>Luftbild und andere Hintergründe:</strong> Sie verdecken die
                Hintergrundkarte bis unter die Straßennamen. Die TILDA-Layer liegen dann alle
                zusammen darüber, ohne Positionen. Untereinander sind sie zu Beginn nach Kategorien
                gestapelt, wie im Code. Jede Änderung auf dieser Seite verschiebt den Layer auch
                dort.
              </li>
            </ul>
            <p>
              Die Liste gilt für alle Regionen; jede Region zeigt daraus die Layer ihrer Kategorien.
              Statische Daten, Hinweise, QA und Maske lassen sich hier nicht sortieren. Änderungen
              sind auf der Karte nach dem Neuladen sichtbar.
            </p>
          </AdminIntro>
        }
      />
      <AdminLayerOrder />
    </>
  )
}
