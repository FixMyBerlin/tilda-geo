import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/20/solid'
import { Square3Stack3DIcon } from '@heroicons/react/24/outline'
import { AnimatePresence, motion, useDragControls } from 'motion/react'
import { useState } from 'react'
import { Categories } from './Categories/Categories'
import { QaConfigCategories } from './QaConfigs/QaConfigCategories'
import { StaticDatasetCategories } from './StaticDatasets/StaticDatasetCategories'

/**
 * Mobile presentation of the layer controls: a floating layer-icon button that
 * opens a bottom sheet holding the category controls. The sheet caps at 80vh so
 * ~20% of the map stays visible, and can be dismissed by swiping it down (drag
 * initiated from the header handle so it doesn't fight the scrollable content),
 * tapping the close button, tapping the backdrop, or pressing Escape.
 *
 * HeadlessUI `Dialog` provides the a11y plumbing (focus trap, Escape, outside
 * click, scroll lock); Motion provides the slide + drag-to-dismiss gesture.
 */
export const MobileLayerSheet = () => {
  const [open, setOpen] = useState(false)
  const dragControls = useDragControls()

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Kategorien"
        className="absolute top-0 left-0 z-20 m-2 flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-md hover:bg-yellow-50 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
      >
        <Square3Stack3DIcon className="size-5" aria-hidden="true" />
        Kategorien
      </button>

      <AnimatePresence>
        {open && (
          <Dialog static open onClose={() => setOpen(false)} className="relative z-30">
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
                  if (info.offset.y > 120 || info.velocity.y > 500) setOpen(false)
                }}
              >
                <DialogPanel className="flex min-h-0 flex-1 flex-col">
                  <header
                    onPointerDown={(event) => dragControls.start(event)}
                    className="flex shrink-0 cursor-grab touch-none flex-col active:cursor-grabbing"
                  >
                    <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-gray-300" />
                    <div className="flex items-center justify-between px-4 py-2">
                      <DialogTitle className="text-sm font-semibold text-gray-900">
                        Kategorien
                      </DialogTitle>
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        onPointerDown={(event) => event.stopPropagation()}
                        aria-label="Schließen"
                        className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                      >
                        <XMarkIcon className="size-5" />
                      </button>
                    </div>
                  </header>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
                    <Categories />
                    <StaticDatasetCategories />
                    <QaConfigCategories />
                  </div>
                </DialogPanel>
              </motion.div>
            </div>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  )
}
