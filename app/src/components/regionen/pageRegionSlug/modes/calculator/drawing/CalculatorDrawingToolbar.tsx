import {
  CheckIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { ModalDialog } from '@/components/shared/Modal/ModalDialog'
import { captureModalOpenOrigin } from '@/components/shared/motion/modalOpenOrigin'

type Props = {
  isDrawing: boolean
  hasAreas: boolean
  canAddArea: boolean
  onAddArea: () => void
  onFinish: () => void
  onCancel: () => void
  onDelete: () => void
}

const groupedBtn = ({ disabled = false }: { disabled?: boolean } = {}) =>
  twJoin(
    // Mobile: icon-only squares. Desktop: labeled buttons.
    'relative -ml-px inline-flex size-10 items-center justify-center text-sm font-semibold ring-1 ring-inset first:rounded-l-md last:rounded-r-md focus:z-10 sm:size-auto sm:min-h-10 sm:justify-start sm:gap-x-1.5 sm:px-3 sm:py-1.5',
    disabled
      ? 'cursor-not-allowed bg-white/70 text-fuchsia-900/40 ring-fuchsia-900/20'
      : 'bg-white text-fuchsia-900 ring-fuchsia-900/20 hover:bg-fuchsia-50',
  )

export function CalculatorDrawingToolbar({
  isDrawing,
  hasAreas,
  canAddArea,
  onAddArea,
  onFinish,
  onCancel,
  onDelete,
}: Props) {
  const [helpModalOpen, setHelpModalOpen] = useState(false)

  return (
    <>
      {/* Top center like the Prüflisten drawing toolbar. Below the floating header buttons on
          mobile (icon-only to fit); with labels on ≥ sm. */}
      <div
        className="pointer-events-auto absolute top-14 left-1/2 isolate z-1000 inline-flex -translate-x-1/2 rounded-md shadow-xs sm:top-2.5"
        role="group"
        aria-label="Fläche zeichnen"
      >
        {isDrawing ? (
          <>
            <button
              type="button"
              className={groupedBtn()}
              title="Fläche abschließen"
              onClick={onFinish}
            >
              <CheckIcon className="size-5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Fertig</span>
            </button>
            <button
              type="button"
              className={groupedBtn()}
              title="Zeichnen abbrechen"
              onClick={onCancel}
            >
              <XMarkIcon className="size-5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Abbrechen</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            className={groupedBtn({ disabled: !hasAreas })}
            title={hasAreas ? 'Fläche löschen' : 'Fläche löschen (noch keine Fläche gezeichnet)'}
            onClick={onDelete}
            disabled={!hasAreas}
          >
            <TrashIcon className="size-5 shrink-0" aria-hidden />
          </button>
        )}
        {/* A second area is the rare case, so the action has no label. */}
        {hasAreas && canAddArea && (
          <button
            type="button"
            className={groupedBtn()}
            title="Weitere Fläche zeichnen"
            onClick={onAddArea}
          >
            <PlusIcon className="size-5 shrink-0" aria-hidden />
          </button>
        )}
        <button
          type="button"
          className={groupedBtn()}
          title="Hilfe"
          onClick={(e) => {
            captureModalOpenOrigin(e.currentTarget)
            setHelpModalOpen(true)
          }}
        >
          <QuestionMarkCircleIcon className="size-5 shrink-0 sm:hidden" aria-hidden />
          <span className="hidden sm:inline">Hilfe</span>
        </button>
      </div>

      {/* Mid-map like the hint of a new note; gone with the first click. */}
      {!isDrawing && !hasAreas && (
        <div className="pointer-events-none absolute inset-x-4 top-1/2 z-10 flex justify-center">
          <div className="rounded-sm bg-fuchsia-800 px-3 py-1.5 text-center text-sm text-white shadow-md">
            In die Karte klicken, um eine Fläche zu zeichnen und ihre Werte zu summieren.
          </div>
        </div>
      )}

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
              Das Plus startet eine zusätzliche Fläche. Bei mehreren Flächen wählt ein Klick die
              Fläche aus, die geändert werden soll.
            </p>
          </section>

          <section>
            <h4 className="font-semibold">Löschen</h4>
            <p>
              Löscht die ausgewählte Fläche. Wenn keine Fläche ausgewählt ist, werden alle Flächen
              gelöscht.
            </p>
          </section>
        </div>
      </ModalDialog>
    </>
  )
}
