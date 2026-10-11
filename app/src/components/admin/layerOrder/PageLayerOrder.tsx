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
              der Karte über dem, was darunter steht. Dazwischen stehen die Ebenen der
              Hintergrundkarte (grau) und was TILDA sonst noch zeichnet (gelb); beides lässt sich
              nicht verschieben. Die Liste gilt für alle Regionen; jede Region zeigt daraus die
              Layer ihrer Kategorien. Änderungen sind auf der Karte nach dem Neuladen sichtbar.
            </p>
            <details>
              <summary className="cursor-pointer font-medium text-gray-700">
                So wird sortiert und verschoben
              </summary>
              <ul>
                <li>
                  <strong>Reihenfolge in einer Gruppe:</strong> Layer am Griff ziehen.
                </li>
                <li>
                  <strong>Andere Gruppe:</strong> über den Knopf rechts in der Zeile wählen, zum
                  Beispiel „Unter den Straßennamen“. Jede Gruppe der Liste ist möglich; „Standard“
                  ist die Gruppe aus dem Code.
                </li>
                <li>
                  <strong>Mehrere Layer verschieben:</strong> Häkchen setzen; mit gedrückter
                  Umschalt-Taste werden alle Zeilen bis zum letzten Häkchen ausgewählt. Unten
                  erscheint dann „Verschieben nach …“.
                </li>
                <li>
                  <strong>Luftbild und andere Hintergründe:</strong> Sie liegen als eine Ebene unter
                  den Straßennamen und verdecken die Hintergrundkarte darunter. Layer von Gruppen
                  darunter rücken dann direkt über das Luftbild. Die Reihenfolge bleibt die dieser
                  Liste.
                </li>
              </ul>
            </details>
            <details>
              <summary className="cursor-pointer font-medium text-gray-700">
                Technisch: Gruppen, Reihenfolge und Deploys
              </summary>
              <p>
                <strong>Gruppe und Reihenfolge auf der Karte.</strong> MapLibre zeichnet die Layer
                eines Kartenstils von unten nach oben.
              </p>
              <ul>
                <li>
                  Jeder Layer wird mit einer <code>beforeId</code> eingefügt: der ID einer Ebene der
                  Hintergrundkarte, unter der er liegt. Alle Layer mit derselben{' '}
                  <code>beforeId</code> bilden eine Gruppe an dieser Stelle.
                </li>
                <li>
                  Innerhalb einer Gruppe zählt die Reihenfolge, in der die Layer eingefügt werden:
                  Jeder neue Layer liegt über den schon vorhandenen. Die Karte rendert die Layer als
                  eine Liste (<code>&lt;AllLayers&gt;</code>), sortiert erst nach Gruppe, dann nach
                  dieser Tabelle.
                </li>
                <li>
                  Bei einem Luftbild bekommen alle Gruppen darunter dieselbe <code>beforeId</code>{' '}
                  direkt über dem Luftbild. Weil die Liste schon nach Gruppe sortiert ist, bleibt
                  die Reihenfolge gleich.
                </li>
              </ul>
              <p>
                <strong>Tabelle und Code.</strong> Die Tabelle <code>MapLayerOrder</code> hat genau
                eine Zeile pro Layer im Code. Dafür gleicht der Server beide einmal nach jedem Start
                ab, also nach jedem Deploy: mit dem ersten Aufruf einer Karte oder dieser Seite.
              </p>
              <ul>
                <li>
                  <strong>Neuer Layer im Code:</strong> Er bekommt beim Abgleich seine Zeile, in der
                  Gruppe aus seiner Konfiguration (<code>beforeId</code> des Layers oder der
                  Subkategorie, sonst nach Layer-Typ) und dort ganz oben.
                </li>
                <li>
                  <strong>Layer aus dem Code entfernt:</strong> Seine Zeile wird beim Abgleich
                  gelöscht.
                </li>
                <li>
                  <strong>Speichern auf dieser Seite</strong> ersetzt die ganze Tabelle. Bestehende
                  Zeilen ändert sonst nichts.
                </li>
              </ul>
            </details>
          </AdminIntro>
        }
      />
      <AdminLayerOrder />
    </>
  )
}
