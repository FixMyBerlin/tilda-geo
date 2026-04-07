import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  ArrowDownTrayIcon,
  BookOpenIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PencilIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import type React from 'react'
import { useRef } from 'react'
import { twJoin } from 'tailwind-merge'

type Props = {
  title: string
  icon: 'info' | 'error' | 'copyright' | 'download' | 'edit'
  buttonCloseName?: string
  open: boolean
  setOpen: (value: boolean) => void
  children: React.ReactNode
}

export const ModalDialog = ({ title, icon, open, setOpen, buttonCloseName, children }: Props) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

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
    edit: {
      bgClass: 'bg-gray-100',
      icon: <PencilIcon className="size-6 text-gray-600" aria-hidden="true" />,
    },
  } satisfies Record<Props['icon'], { bgClass: string; icon: React.ReactNode }>

  return (
    <Dialog open={open} onClose={setOpen} className="relative z-20" initialFocus={closeButtonRef}>
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />

      <div className="fixed inset-0 z-20 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-3 pb-4 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:px-6 sm:pt-4 sm:pb-6 data-closed:sm:translate-y-0 data-closed:sm:scale-95"
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

              <DialogTitle as="h3" className="min-w-0 flex-1 text-base font-semibold text-gray-900">
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
        </div>
      </div>
    </Dialog>
  )
}
