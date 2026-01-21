import { CloseButton } from '@/src/app/_components/CloseButton/CloseButton'
import { Dialog, Transition, TransitionChild } from '@headlessui/react'
import {
  ArrowDownTrayIcon,
  BookOpenIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import React, { Fragment, useRef } from 'react'
import { twJoin } from 'tailwind-merge'

export type ModalDialogProps = {
  title: string
  icon: 'info' | 'error' | 'copyright' | 'download' | 'edit'
  buttonCloseName?: string
  open: boolean
  setOpen: (value: boolean) => void
  children: React.ReactNode
}

export const ModalDialog = ({
  title,
  icon,
  open,
  setOpen,
  buttonCloseName,
  children,
}: ModalDialogProps) => {
  const cancelButtonRef = useRef(null)

  type IconComponent = Record<typeof icon, { bgClass: string; icon: React.ReactNode }>
  const iconComponent: IconComponent = {
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
  }

  return (
    <Transition show={open} as={Fragment}>
      <Dialog
        as="section"
        className="relative z-20"
        initialFocus={cancelButtonRef}
        onClose={setOpen}
      >
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 flex w-screen justify-center overflow-y-auto bg-gray-950/25 px-2 py-2 backdrop-blur-sm focus:outline-0 sm:px-6 sm:py-8 lg:px-8 lg:py-16 dark:bg-gray-950/50" />
        </TransitionChild>
        <div className="fixed inset-x-0 inset-y-5 max-h-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:w-full sm:max-w-lg sm:p-6">
                <CloseButton onClick={() => setOpen(false)} positionClasses="top-6 right-6" />

                <div className="sm:flex sm:items-start">
                  <div
                    className={twJoin(
                      iconComponent[icon].bgClass,
                      'mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10',
                    )}
                  >
                    {iconComponent[icon].icon}
                  </div>

                  <div className="mt-3 w-full text-center sm:mt-2 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
                    <div className="mt-2">{children}</div>
                  </div>
                </div>

                {buttonCloseName && (
                  <div className="mt-5 sm:mt-4 sm:ml-10 sm:flex sm:gap-3 sm:pl-4">
                    {/* Once we need a close action or OK/Cancel pattern, we neecd to extend this component */}
                    {/* <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto sm:text-sm"
                      onClick={() => setOpen(false)}
                    >
                      Deactivate
                    </button> */}
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                      onClick={() => setOpen(false)}
                      ref={cancelButtonRef}
                    >
                      {buttonCloseName}
                    </button>
                  </div>
                )}
              </div>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
