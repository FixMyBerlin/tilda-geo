import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/20/solid'
import { AnimatePresence, motion, useDragControls } from 'motion/react'
import type { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

/** Sheet color schemes — panel bg + grabber tint per use. */
type SheetTone = 'default' | 'calculator' | 'debug'

const toneStyles: Record<SheetTone, { panel: string; grabber: string }> = {
  default: { panel: 'bg-white', grabber: 'bg-gray-300' },
  calculator: { panel: 'bg-fuchsia-800 text-white', grabber: 'bg-white/40' },
  debug: { panel: 'bg-pink-300 text-pink-950', grabber: 'bg-pink-500/50' },
}

/** How much of the map stays visible above the sheet. */
type SheetMapPeek = 'minimal' | '10%' | '20%'

const maxHeightByPeek: Record<SheetMapPeek, string> = {
  // Just enough room for the close button above the sheet (sheet ≈ full height).
  minimal: 'max-h-[calc(100dvh-3.5rem)]',
  '10%': 'max-h-[90dvh]',
  '20%': 'max-h-[80dvh]',
}

type Props = {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  /** How much map to leave visible above the sheet (default `minimal` ≈ full height). */
  mapPeek?: SheetMapPeek
  /** Color scheme of the sheet chrome (default white). Content colors are the child's job. */
  tone?: SheetTone
}

/**
 * Reusable mobile bottom sheet: slides up from the bottom (nearly full height by
 * default so content gets maximum room), and can be dismissed by swiping the header
 * handle down, tapping the close button (which sits above the sheet), tapping the
 * backdrop, or Escape. The title is visually hidden (`sr-only`) but kept for a11y.
 *
 * HeadlessUI `Dialog` provides the a11y plumbing (focus trap, Escape, outside
 * click, scroll lock); Motion provides the slide + drag-to-dismiss gesture.
 * Drag is initiated only from the header handle (via `useDragControls`) so it
 * doesn't fight the scrollable content.
 */
export const MobileBottomSheet = ({
  open,
  onClose,
  title,
  children,
  mapPeek = 'minimal',
  tone = 'default',
}: Props) => {
  const dragControls = useDragControls()
  const toneStyle = toneStyles[tone]
  const maxHeight = maxHeightByPeek[mapPeek]

  return (
    <AnimatePresence>
      {open && (
        <Dialog static open onClose={onClose} className="relative z-40">
          <motion.div
            className="fixed inset-0 bg-black/30"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <div className="fixed inset-x-0 bottom-0 flex flex-col items-stretch">
            {/* Close button above the sheet, on the backdrop. Plain for now (drop-shadow
                only so the white icon stays legible over light map areas). */}
            <div className="flex justify-end px-3 pb-1.5">
              <button
                type="button"
                onClick={onClose}
                aria-label="Schließen"
                className="rounded p-2 text-white drop-shadow-md"
              >
                <XMarkIcon className="size-7" />
              </button>
            </div>
            <motion.div
              className={twMerge(
                'flex w-full flex-col overflow-hidden rounded-t-xl shadow-xl',
                toneStyle.panel,
                maxHeight,
              )}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              drag="y"
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_event, info) => {
                if (info.offset.y > 120 || info.velocity.y > 500) onClose()
              }}
            >
              <DialogPanel className="flex min-h-0 flex-1 flex-col">
                {/* Drag-to-close handle. `py-2.5` gives the grabber visible, symmetric breathing
                    room (so content isn't crammed against it); the `after:` pseudo enlarges the
                    touch area a further ~8px each side WITHOUT affecting layout flow (`z-10` lifts
                    it above the content so the downward extension still captures the drag). */}
                <header
                  onPointerDown={(event) => dragControls.start(event)}
                  className="relative z-10 flex shrink-0 cursor-grab touch-none flex-col py-2.5 select-none after:absolute after:inset-x-0 after:-top-2 after:-bottom-2 after:content-[''] active:cursor-grabbing"
                >
                  <div className={twMerge('mx-auto h-1.5 w-10 rounded-full', toneStyle.grabber)} />
                  <DialogTitle className="sr-only">{title}</DialogTitle>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
                  {children}
                </div>
              </DialogPanel>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
