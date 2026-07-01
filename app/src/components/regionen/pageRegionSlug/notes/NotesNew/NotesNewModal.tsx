import { Dialog, Transition, TransitionChild } from '@headlessui/react'
import { Fragment, useRef } from 'react'
import { useOsmNotesActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/userMapNotes'
import { useNewInternalNoteMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesAtlasParams'
import { useNewOsmNoteMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesOsmParams'
import { CloseButton } from '@/components/shared/CloseButton/CloseButton'

export const NotesNewModal = ({ children }: { children: React.ReactNode }) => {
  const { setNewInternalNoteMapParam } = useNewInternalNoteMapParam()
  const { setNewOsmNoteMapParam } = useNewOsmNoteMapParam()
  const { setOsmNewNoteFeature } = useOsmNotesActions()
  const closeButtonRef = useRef(null)

  const setClose = () => {
    setNewInternalNoteMapParam(null)
    setNewOsmNoteMapParam(null)
    setOsmNewNoteFeature(undefined)
  }

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog onClose={setClose} className="relative z-1100">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 z-1100 flex w-screen justify-center overflow-y-auto bg-gray-950/25 px-2 py-2 backdrop-blur-sm focus:outline-0 sm:px-6 sm:py-8 lg:px-8 lg:py-16" />
        </TransitionChild>

        <TransitionChild
          as="main"
          className="fixed inset-0 z-1100 w-screen overflow-y-auto sm:pt-0"
          // Transition props
          enter="ease-out duration-300"
          enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enterTo="opacity-100 translate-y-0 sm:scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 translate-y-0 sm:scale-100"
          leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <div className="mx-auto grid min-h-full max-w-7xl grid-rows-[auto] content-start justify-items-center p-2.5 sm:grid-rows-[1fr_auto_3fr] sm:content-normal sm:p-4">
            <TransitionChild
              as={Dialog.Panel}
              className="relative row-start-1 max-h-[calc(100dvh-1.25rem)] w-full min-w-0 overflow-y-auto rounded-lg bg-amber-50 shadow-xl ring-1 ring-gray-950/10 sm:row-start-2 sm:mb-auto sm:max-h-none sm:overflow-clip forced-colors:outline"
              // Transition props
              enter="ease-out duration-100"
              enterFrom="sm:scale-95"
              enterTo="sm:scale-100"
              leave="ease-in duration-100"
              leaveFrom="sm:scale-100"
              leaveTo="sm:scale-100"
            >
              <CloseButton
                ref={closeButtonRef}
                onClick={setClose}
                positionClasses="absolute top-2 right-2 z-30"
              />
              {children}
            </TransitionChild>
          </div>
        </TransitionChild>
      </Dialog>
    </Transition>
  )
}
