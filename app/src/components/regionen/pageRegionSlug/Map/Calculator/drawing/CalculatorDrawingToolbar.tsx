import {
  PencilIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { ModalDialog } from '@/components/shared/Modal/ModalDialog'
import type { CalculatorUrlDrawMode } from './calculatorUrlDrawMode'

type Props = {
  drawMode: CalculatorUrlDrawMode
  canEdit: boolean
  onDrawModeChange: (mode: CalculatorUrlDrawMode) => void
  onDelete: () => void
}

const groupedBtn = ({
  active,
  disabled = false,
  rounded,
}: {
  active: boolean
  disabled?: boolean
  rounded: 'left' | 'middle' | 'right'
}) =>
  twJoin(
    // Mobile: 52px square (matches the bottom-right category button). Desktop: labeled buttons.
    'relative -ml-px inline-flex size-13 items-center justify-center text-sm font-semibold ring-1 ring-inset focus:z-10 sm:size-auto sm:min-h-14 sm:justify-start sm:gap-x-2 sm:px-4 sm:py-2',
    rounded === 'left' && 'rounded-l-md',
    rounded === 'right' && 'rounded-r-md',
    rounded === 'middle' && 'rounded-none',
    disabled
      ? 'cursor-not-allowed bg-white/70 text-fuchsia-900/40 ring-fuchsia-900/20'
      : active
        ? 'bg-fuchsia-700 text-white ring-fuchsia-700'
        : 'bg-white text-fuchsia-900 ring-fuchsia-900/20 hover:bg-fuchsia-50',
  )

export function CalculatorDrawingToolbar({ drawMode, canEdit, onDrawModeChange, onDelete }: Props) {
  const [helpModalOpen, setHelpModalOpen] = useState(false)

  return (
    <>
      {/* Below the floating header buttons on mobile (icon-only to fit); next to the
          desktop sidebar (with labels) on ≥ sm. */}
      <div className="pointer-events-auto absolute top-14 left-2 isolate z-1000 inline-flex rounded-md shadow-xs sm:top-2.5 sm:left-67.5">
        <button
          type="button"
          className={groupedBtn({ active: drawMode === 'polygon', rounded: 'left' })}
          title="Fläche zeichnen"
          onClick={() => onDrawModeChange('polygon')}
        >
          <PlusIcon className="size-7 shrink-0" aria-hidden />
          <span className="hidden sm:inline">Fläche zeichnen</span>
        </button>
        <button
          type="button"
          className={groupedBtn({
            active: drawMode === 'edit',
            disabled: !canEdit,
            rounded: 'middle',
          })}
          title={
            canEdit
              ? 'Verschieben & Ändern'
              : 'Verschieben & Ändern (erst nach einer Fläche verfügbar)'
          }
          onClick={() => onDrawModeChange('edit')}
          disabled={!canEdit}
        >
          <PencilIcon className="size-7 shrink-0" aria-hidden />
          <span className="hidden sm:inline">Verschieben & Ändern</span>
        </button>
        <button
          type="button"
          className={groupedBtn({ active: false, rounded: 'middle' })}
          title="Fläche löschen"
          onClick={onDelete}
        >
          <TrashIcon className="size-7 shrink-0" aria-hidden />
        </button>
        <button
          type="button"
          className={groupedBtn({ active: false, rounded: 'right' })}
          title="Hilfe"
          onClick={() => setHelpModalOpen(true)}
        >
          <QuestionMarkCircleIcon className="size-7 shrink-0 sm:hidden" aria-hidden />
          <span className="hidden sm:inline">Hilfe</span>
        </button>
      </div>

      <ModalDialog
        title="Hilfe zur Flächen-Bearbeitung"
        icon="info"
        open={helpModalOpen}
        setOpen={setHelpModalOpen}
        buttonCloseName="Schließen"
      >
        <div className="space-y-3 text-sm text-gray-700">
          <section>
            <h4 className="font-semibold">Modus „Fläche zeichnen“</h4>
            <p>Jeder Klick in die Karte fügt einen Stützpunkt zur Fläche hinzu.</p>
            <p>Zum Abschließen der Fläche bitte doppelklicken.</p>
            <p>
              <code>ESC</code> bricht das Zeichnen ab.
            </p>
          </section>

          <section>
            <h4 className="font-semibold">Modus „Verschieben &amp; Ändern“</h4>
            <p>Als erstes muss die Fläche angeklickt werden.</p>
            <p>Danach kann die ganze Fläche oder einzelne Stützpunkte verschoben werden.</p>
            <p>
              Ein Klick auf einen kleinen Hilfs-Punkt erzeugt einen neuen Stützpunkt, der danach mit
              einem zweiten Klick verschoben werden kann.
            </p>
          </section>

          <section>
            <h4 className="font-semibold">Funktion „Löschen“</h4>
            <p>
              Löscht die aktuell ausgewählte Fläche. Wenn keine Fläche ausgewählt ist, werden alle
              Flächen gelöscht.
            </p>
          </section>
        </div>
      </ModalDialog>
    </>
  )
}
