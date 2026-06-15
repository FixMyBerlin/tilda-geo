import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/20/solid'
import { AnimatePresence, motion, useDragControls } from 'motion/react'
import type { ReactNode } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
}

/**
 * Reusable mobile bottom sheet: slides up from the bottom, capped at 80vh so
 * ~20% of the map stays visible, and can be dismissed by swiping the header
 * handle down, tapping the close button, tapping the backdrop, or Escape.
 *
 * HeadlessUI `Dialog` provides the a11y plumbing (focus trap, Escape, outside
 * click, scroll lock); Motion provides the slide + drag-to-dismiss gesture.
 * Drag is initiated only from the header handle (via `useDragControls`) so it
 * doesn't fight the scrollable content.
 */
export const MobileBottomSheet = ({ open, onClose, title, children }: Props) => {
  const dragControls = useDragControls()

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
          <div className="fixed inset-x-0 bottom-0 flex justify-center">
            <motion.div
              className="flex max-h-[80vh] w-full flex-col overflow-hidden rounded-t-xl bg-white shadow-xl"
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
                <header
                  onPointerDown={(event) => dragControls.start(event)}
                  className="flex shrink-0 cursor-grab touch-none flex-col select-none active:cursor-grabbing"
                >
                  <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-gray-300" />
                  <div className="flex items-center justify-between px-4 py-2">
                    <DialogTitle className="min-w-0 text-sm font-semibold text-gray-900">
                      {title}
                    </DialogTitle>
                    <button
                      type="button"
                      onClick={onClose}
                      onPointerDown={(event) => event.stopPropagation()}
                      aria-label="Schließen"
                      className="-mr-1 shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    >
                      <XMarkIcon className="size-5" />
                    </button>
                  </div>
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
