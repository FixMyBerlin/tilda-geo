import { Dialog, DialogPanel } from '@headlessui/react'
import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import { useOsmNotesActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/userMapNotes'
import { useNewInternalNoteMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesAtlasParams'
import { useNewOsmNoteMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesOsmParams'
import { CloseButton } from '@/components/shared/CloseButton/CloseButton'
import {
  clearModalOpenOrigin,
  getModalOpenOriginOffset,
} from '@/components/shared/motion/modalOpenOrigin'
import { UI_SPRING } from '@/components/shared/motion/spring.const'

export const NotesNewModal = ({ children }: { children: ReactNode }) => {
  const { setNewInternalNoteMapParam } = useNewInternalNoteMapParam()
  const { setNewOsmNoteMapParam } = useNewOsmNoteMapParam()
  const { setOsmNewNoteFeature } = useOsmNotesActions()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  // Local show so exit runs before we clear the URL (which unmounts this modal from the parent).
  const [localOpen, setLocalOpen] = useState(true)

  const offset = getModalOpenOriginOffset()

  const handleClose = () => setLocalOpen(false)

  const handleExitComplete = () => {
    setNewInternalNoteMapParam(null)
    setNewOsmNoteMapParam(null)
    setOsmNewNoteFeature(undefined)
    clearModalOpenOrigin()
  }

  // Motion + `Dialog static` (same split as ModalDialog): Headless UI keeps the
  // a11y plumbing (focus trap, Escape, outside click), Motion runs enter/exit springs.
  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {localOpen && (
        <Dialog
          static
          open
          onClose={handleClose}
          className="relative z-1100"
          initialFocus={closeButtonRef}
        >
          <motion.div
            className="fixed inset-0 z-1100 flex w-screen justify-center overflow-y-auto bg-gray-950/25 px-2 py-2 backdrop-blur-sm focus:outline-0 sm:px-6 sm:py-8 lg:px-8 lg:py-16"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          <motion.main
            className="fixed inset-0 z-1100 w-screen overflow-y-auto sm:pt-0"
            initial={{ opacity: 0, scale: 0.92, ...offset }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, ...offset, transition: { duration: 0.15 } }}
            transition={UI_SPRING}
          >
            <div className="mx-auto grid min-h-full max-w-7xl grid-rows-[auto] content-start justify-items-center p-2.5 sm:grid-rows-[1fr_auto_3fr] sm:content-normal sm:p-4">
              <DialogPanel className="relative row-start-1 max-h-[calc(100dvh-1.25rem)] w-full min-w-0 overflow-y-auto rounded-lg bg-amber-50 shadow-xl ring-1 ring-gray-950/10 sm:row-start-2 sm:mb-auto sm:max-h-none sm:overflow-clip forced-colors:outline">
                <CloseButton
                  ref={closeButtonRef}
                  onClick={handleClose}
                  positionClasses="absolute top-2 right-2 z-30"
                />
                {children}
              </DialogPanel>
            </div>
          </motion.main>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
