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
              Hintergrundkarte (grau) und was TILDA sonst noch zeichnet (gelb, „Fest“); beides lässt
              sich nicht verschieben.
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
                <strong>Luftbild und andere Hintergründe:</strong> Sie liegen als eine Ebene unter
                den Straßennamen und verdecken die Hintergrundkarte darunter. Layer von Positionen
                darunter rücken dann direkt über das Luftbild. Die Reihenfolge bleibt die dieser
                Liste.
              </li>
            </ul>
            <p>
              Die Liste gilt für alle Regionen; jede Region zeigt daraus die Layer ihrer Kategorien.
              Änderungen sind auf der Karte nach dem Neuladen sichtbar.
            </p>
          </AdminIntro>
        }
      />
      <AdminLayerOrder />
    </>
  )
}
