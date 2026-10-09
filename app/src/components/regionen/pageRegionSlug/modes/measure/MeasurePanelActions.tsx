import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { ModalDialog } from '@/components/shared/Modal/ModalDialog'
import { captureModalOpenOrigin } from '@/components/shared/motion/modalOpenOrigin'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import {
  modePanelHeaderIconButtonClassName,
  modePanelPrimaryButtonClassName,
} from '../modePanel.const'
import { useMeasureDraw } from './drawing/useMeasureDraw'

const tools = [
  { tool: 'line', label: 'Linie', idle: 'Linie messen', armed: 'Linie: in die Karte klicken' },
  {
    tool: 'polygon',
    label: 'Fläche',
    idle: 'Fläche messen',
    armed: 'Fläche: in die Karte klicken',
  },
] as const

/**
 * Header actions of the Messen panel, where the other modes have "new entry": start a line
 * or an area, and the help for drawing. Deleting is the bin next to each measurement.
 */
export const MeasurePanelActions = () => {
  const draw = useMeasureDraw()
  const [helpModalOpen, setHelpModalOpen] = useState(false)

  return (
    <>
      {tools.map(({ tool, label, idle, armed }) => {
        const isArmed = draw.tool === tool
        const title = isArmed ? armed : idle
        return (
          <Tooltip key={tool} text={title}>
            <button
              type="button"
              // A second click takes the offer back.
              onClick={() => draw.setTool(isArmed ? 'select' : tool)}
              disabled={draw.isDrawing}
              aria-pressed={isArmed}
              aria-label={title}
              className={twJoin(modePanelPrimaryButtonClassName, isArmed && 'bg-yellow-100')}
            >
              + {label}
            </button>
          </Tooltip>
        )
      })}
      <Tooltip text="Hilfe zum Messen">
        <button
          type="button"
          onClick={(event) => {
            captureModalOpenOrigin(event.currentTarget)
            setHelpModalOpen(true)
          }}
          aria-label="Hilfe zum Messen"
          className={modePanelHeaderIconButtonClassName}
        >
          <QuestionMarkCircleIcon className="size-5" aria-hidden />
        </button>
      </Tooltip>

      <ModalDialog
        title="Hilfe zum Messen"
        icon="info"
        open={helpModalOpen}
        setOpen={setHelpModalOpen}
        buttonCloseName="Schließen"
      >
        <div className="space-y-3 text-sm text-gray-700">
          <section>
            <h4 className="font-semibold">Linie oder Fläche messen</h4>
            <p>„+ Linie“ oder „+ Fläche“ wählen. Jeder Klick in die Karte setzt einen Eckpunkt.</p>
            <p>
              Zum Abschließen doppelklicken, den letzten Eckpunkt anklicken oder „Fertig“ wählen.
            </p>
            <p>
              <code>ESC</code> bricht das Zeichnen ab, die Rücktaste entfernt den letzten Eckpunkt.
            </p>
          </section>

          <section>
            <h4 className="font-semibold">Genau messen</h4>
            <p>
              Beim Messen zeigt die Karte ein Luftbild. Die Lupe in der Kartenecke zeigt die Stelle
              vergrößert, an der der nächste Eckpunkt gesetzt oder ein Eckpunkt verschoben wird. Das
              Fadenkreuz markiert den Punkt, der gemessen wird.
            </p>
            <p>Die Lupe erscheint, sobald die Karte nah genug herangezoomt ist.</p>
          </section>

          <section>
            <h4 className="font-semibold">Messung ändern</h4>
            <p>Ein Klick auf eine Messung wählt sie aus; dann zeigt sie die Länge jeder Seite.</p>
            <p>Eckpunkte verschieben: Eckpunkt ziehen.</p>
            <p>Eckpunkt hinzufügen: auf die Linie klicken oder den neuen Punkt gleich ziehen.</p>
            <p>Eckpunkt entfernen: Eckpunkt doppelklicken.</p>
            <p>Linie verlängern: den ersten oder letzten Eckpunkt anklicken und weiterzeichnen.</p>
          </section>

          <section>
            <h4 className="font-semibold">Teilen und löschen</h4>
            <p>
              Die Messungen stehen im Link der Seite. Wer den Link öffnet, sieht dieselben
              Messungen; gespeichert wird nichts.
            </p>
            <p>Der Papierkorb neben einer Messung löscht sie.</p>
          </section>
        </div>
      </ModalDialog>
    </>
  )
}
