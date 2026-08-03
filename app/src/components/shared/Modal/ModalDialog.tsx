import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  ArrowDownTrayIcon,
  BookOpenIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PencilIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'motion/react'
import type React from 'react'
import { useRef } from 'react'
import { twJoin } from 'tailwind-merge'
import {
  clearModalOpenOrigin,
  getModalOpenOriginOffset,
} from '@/components/shared/motion/modalOpenOrigin'
import { UI_SPRING } from '@/components/shared/motion/spring.const'

type Props = {
  title: string
  icon: 'info' | 'error' | 'copyright' | 'download' | 'edit' | 'docs'
  buttonCloseName?: string
  open: boolean
  setOpen: (value: boolean) => void
  children: React.ReactNode
  /** Optional test id on the dialog panel (E2E). */
  panelTestId?: string
  onExitComplete?: () => void
}

export const ModalDialog = ({
  title,
  icon,
  open,
  setOpen,
  buttonCloseName,
  children,
  panelTestId,
  onExitComplete,
}: Props) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Capture happens in the open click before setOpen(true); peek here for enter/exit offset.
  const offset = open ? getModalOpenOriginOffset() : { x: 0, y: 16 }

  const iconComponent = {
    info: {
      bgClass: 'bg-green-100',
      icon: <InformationCircleIcon className="size-6 text-green-600" aria-hidden="true" />,
    },
    error: {
      bgClass: 'bg-red-100',
      icon: <ExclamationTriangleIcon className="size-6 text-red-600" aria-hidden="true" />,
    },
    copyright: {
      bgClass: 'bg-blue-100',
      icon: <BookOpenIcon className="size-6 text-blue-600" aria-hidden="true" />,
    },
    download: {
      bgClass: 'bg-purple-100',
      icon: <ArrowDownTrayIcon className="size-6 text-purple-600" aria-hidden="true" />,
    },
    docs: {
      bgClass: 'bg-blue-100',
      icon: <BookOpenIcon className="size-6 text-blue-600" aria-hidden="true" />,
    },
    edit: {
      bgClass: 'bg-gray-100',
      icon: <PencilIcon className="size-6 text-gray-600" aria-hidden="true" />,
    },
  } satisfies Record<Props['icon'], { bgClass: string; icon: React.ReactNode }>

  // Motion + `Dialog static` (same split as MobileBottomSheet): Headless UI keeps the
  // a11y plumbing (focus trap, Escape, outside click), Motion runs enter/exit springs.
  return (
    <AnimatePresence
      onExitComplete={() => {
        clearModalOpenOrigin()
        onExitComplete?.()
      }}
    >
      {open && (
        <Dialog
          static
          open
          onClose={setOpen}
          className="relative z-1100"
          initialFocus={closeButtonRef}
        >
          <motion.div
            className="fixed inset-0 bg-gray-500/75"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          <div className="fixed inset-0 z-1100 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center px-2.5 py-4 text-center sm:items-center sm:p-0">
              <motion.div
                className="w-full max-w-none sm:my-8 sm:max-w-prose"
                initial={{ opacity: 0, scale: 0.92, ...offset }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, ...offset, transition: { duration: 0.15 } }}
                transition={UI_SPRING}
              >
                <DialogPanel
                  data-testid={panelTestId}
                  className="relative w-full transform overflow-hidden rounded-lg bg-white px-4 pt-3 pb-4 text-left shadow-xl sm:px-6 sm:pt-4 sm:pb-6"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={twJoin(
                        iconComponent[icon].bgClass,
                        'flex size-10 shrink-0 items-center justify-center rounded-full',
                      )}
                    >
                      {iconComponent[icon].icon}
                    </div>

                    <DialogTitle
                      as="h3"
                      className="min-w-0 flex-1 text-base font-semibold text-gray-900"
                    >
                      {title}
                    </DialogTitle>

                    <button
                      type="button"
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500"
                      onClick={() => setOpen(false)}
                      ref={closeButtonRef}
                    >
                      <span className="sr-only">Schließen</span>
                      <XMarkIcon className="size-5" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mt-3 text-gray-700">{children}</div>

                  {buttonCloseName && (
                    <div className="mt-5 sm:mt-4 sm:flex sm:justify-end">
                      <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring-1 inset-ring-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500 sm:w-auto"
                        onClick={() => setOpen(false)}
                      >
                        {buttonCloseName}
                      </button>
                    </div>
                  )}
                </DialogPanel>
              </motion.div>
            </div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
