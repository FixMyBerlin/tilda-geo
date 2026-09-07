import { modePanelMutedClassName } from '../../modePanel.const'

/** Compose body while drawing a new review entry (toolbar is on the map). */
export const ReviewEntryNew = () => (
  <div className="px-4 py-3">
    <p className={modePanelMutedClassName}>
      Wählen Sie Punkt, Linie oder Fläche und zeichnen Sie den neuen Eintrag auf der Karte. Der
      Eintrag wird gespeichert, sobald die Zeichnung fertig ist.
    </p>
  </div>
)
