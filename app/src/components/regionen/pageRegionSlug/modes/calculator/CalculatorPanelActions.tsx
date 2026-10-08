import { PlusIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { ModalDialog } from '@/components/shared/Modal/ModalDialog'
import { captureModalOpenOrigin } from '@/components/shared/motion/modalOpenOrigin'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import { modePanelHeaderIconButtonClassName } from '../modePanel.const'
import { useCalculatorDraw } from './drawing/useCalculatorDraw'
import { useCalculatorAreas } from './useCalculatorAreas'

/**
 * Header actions of the Summieren panel, where the other modes have "new entry": start a
 * further area, and the help for drawing. The first area needs no button (a click on the map
 * starts it); deleting is the bin next to each area in the result.
 */
export const CalculatorPanelActions = () => {
  const draw = useCalculatorDraw()
  const { drawAreas } = useCalculatorAreas()
  const [helpModalOpen, setHelpModalOpen] = useState(false)

  const isAdding = draw.tool === 'polygon' && drawAreas.length > 0
  const canAdd = drawAreas.length > 0 && !draw.isDrawing && (isAdding || draw.canAdd('polygon'))
  const addLabel = isAdding ? 'Weitere Fläche: in die Karte klicken' : 'Weitere Fläche zeichnen'

  return (
    <>
      <Tooltip text={addLabel}>
        <button
          type="button"
          // A second click takes the offer back.
          onClick={() => draw.setTool(isAdding ? 'select' : 'polygon')}
          disabled={!canAdd}
          aria-pressed={isAdding}
          aria-label={addLabel}
          className={twJoin(modePanelHeaderIconButtonClassName, isAdding && 'bg-yellow-100')}
        >
          <PlusIcon className="size-5" aria-hidden />
        </button>
      </Tooltip>
      <Tooltip text="Hilfe zum Zeichnen">
        <button
          type="button"
          onClick={(event) => {
            captureModalOpenOrigin(event.currentTarget)
            setHelpModalOpen(true)
          }}
          aria-label="Hilfe zum Zeichnen"
          className={modePanelHeaderIconButtonClassName}
        >
          <QuestionMarkCircleIcon className="size-5" aria-hidden />
        </button>
      </Tooltip>

      <ModalDialog
        title="Hilfe zur Flächen-Bearbeitung"
        icon="info"
        open={helpModalOpen}
        setOpen={setHelpModalOpen}
        buttonCloseName="Schließen"
      >
        <div className="space-y-3 text-sm text-gray-700">
          <section>
            <h4 className="font-semibold">Fläche zeichnen</h4>
            <p>Jeder Klick in die Karte fügt einen Eckpunkt hinzu.</p>
            <p>
              Zum Abschließen doppelklicken, den ersten Eckpunkt anklicken oder „Fertig“ wählen.
            </p>
            <p>
              <code>ESC</code> bricht das Zeichnen ab, die Rücktaste entfernt den letzten Eckpunkt.
            </p>
          </section>

          <section>
            <h4 className="font-semibold">Fläche ändern</h4>
            <p>Die Fläche lässt sich jederzeit direkt auf der Karte ändern.</p>
            <p>Eckpunkte verschieben: Eckpunkt ziehen.</p>
            <p>
              Eckpunkt hinzufügen: an beliebiger Stelle auf die Kante klicken. Wer die Maustaste
              gedrückt hält, zieht den neuen Eckpunkt gleich an seinen Platz.
            </p>
            <p>Eckpunkt entfernen: Eckpunkt doppelklicken.</p>
            <p>Ganze Fläche verschieben: am Verschiebe-Symbol in der Mitte der Fläche ziehen.</p>
          </section>

          <section>
            <h4 className="font-semibold">Weitere Flächen</h4>
            <p>
              Das Plus oben im Bereich „Summieren“ startet eine zusätzliche Fläche. Bei mehreren
              Flächen wählt ein Klick auf der Karte die Fläche aus, die geändert werden soll.
            </p>
          </section>

          <section>
            <h4 className="font-semibold">Löschen</h4>
            <p>
              Der Papierkorb neben einer Fläche im Ergebnis löscht sie. Die ausgewählte Fläche lässt
              sich auch mit der Entfernen-Taste löschen.
            </p>
          </section>
        </div>
      </ModalDialog>
    </>
  )
}
