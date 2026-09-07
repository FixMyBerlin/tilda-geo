import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  ArrowDownTrayIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
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
  type ModeAccentMode,
  modeAccentInvertedClassName,
  modeAccentInvertedFgClassName,
  modeAccentStyle,
  modeAccentTintClassName,
  modeIdentity,
} from '@/components/regionen/pageRegionSlug/modes/modeIdentity'
import {
  clearModalOpenOrigin,
  getModalOpenOriginOffset,
} from '@/components/shared/motion/modalOpenOrigin'
import { UI_SPRING } from '@/components/shared/motion/spring.const'

type ModalIcon = 'info' | 'error' | 'copyright' | 'download' | 'edit' | 'docs' | 'reviewList'

type Props = {
  title: string
  icon: ModalIcon
  /** Tint header icon with a region mode accent (notes / qa / reviewLists). */
  mode?: ModeAccentMode
  buttonCloseName?: string
  /** Left-aligned footer action (e.g. delete). */
  footerStart?: React.ReactNode
  /** Primary footer action (e.g. submit). Rendered next to the close button. */
  primaryAction?: React.ReactNode
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
  mode,
  open,
  setOpen,
  buttonCloseName,
  footerStart,
  primaryAction,
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
      iconClass: 'text-green-600',
      Icon: InformationCircleIcon,
    },
    error: {
      bgClass: 'bg-red-100',
      iconClass: 'text-red-600',
      Icon: ExclamationTriangleIcon,
    },
    copyright: {
      bgClass: 'bg-blue-100',
      iconClass: 'text-blue-600',
      Icon: BookOpenIcon,
    },
    download: {
      bgClass: 'bg-purple-100',
      iconClass: 'text-purple-600',
      Icon: ArrowDownTrayIcon,
    },
    docs: {
      bgClass: 'bg-blue-100',
      iconClass: 'text-blue-600',
      Icon: BookOpenIcon,
    },
    edit: {
      bgClass: 'bg-gray-100',
      iconClass: 'text-gray-600',
      Icon: PencilIcon,
    },
    reviewList: {
      bgClass: 'bg-teal-100',
      iconClass: 'text-teal-600',
      Icon: ClipboardDocumentCheckIcon,
    },
  } satisfies Record<ModalIcon, { bgClass: string; iconClass: string; Icon: typeof PencilIcon }>

  const { bgClass, iconClass, Icon } = iconComponent[icon]
  const modeAccent = mode ? modeIdentity[mode].accent : undefined

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
                  className={twJoin(
                    'relative w-full transform overflow-hidden rounded-lg px-4 pt-3 pb-4 text-left shadow-xl sm:px-6 sm:pt-4 sm:pb-6',
                    modeAccent ? modeAccentTintClassName : 'bg-white',
                  )}
                  style={modeAccent ? modeAccentStyle(modeAccent) : undefined}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={twJoin(
                        mode
                          ? twJoin(modeAccentInvertedClassName, modeAccentInvertedFgClassName(mode))
                          : bgClass,
                        'flex size-10 shrink-0 items-center justify-center rounded-full',
                      )}
                    >
                      <Icon
                        className={twJoin('size-6', mode ? undefined : iconClass)}
                        aria-hidden="true"
                      />
                    </div>

                    <DialogTitle
                      as="h3"
                      className="min-w-0 flex-1 text-base font-semibold text-gray-900"
                    >
                      {title}
                    </DialogTitle>

                    <button
                      type="button"
                      className={twJoin(
                        'inline-flex size-8 shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500',
                        modeAccent ? 'hover:bg-white/60' : 'hover:bg-gray-100',
                      )}
                      onClick={() => setOpen(false)}
                      ref={closeButtonRef}
                    >
                      <span className="sr-only">Schließen</span>
                      <XMarkIcon className="size-5" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mt-3 text-gray-700">{children}</div>

                  {(footerStart || primaryAction || buttonCloseName) &&
                    (footerStart ? (
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 sm:mt-4">
                        <div className="flex shrink-0 items-center gap-3">{footerStart}</div>
                        {(primaryAction || buttonCloseName) && (
                          <div className="flex w-full flex-col-reverse gap-3 sm:ml-auto sm:w-auto sm:flex-row-reverse sm:gap-3">
                            {primaryAction}
                            {buttonCloseName ? (
                              <button
                                type="button"
                                className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring-1 inset-ring-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500 sm:w-auto"
                                onClick={() => setOpen(false)}
                              >
                                {buttonCloseName}
                              </button>
                            ) : null}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse sm:gap-3">
                        {primaryAction}
                        {buttonCloseName ? (
                          <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring-1 inset-ring-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500 sm:mt-0 sm:w-auto"
                            onClick={() => setOpen(false)}
                          >
                            {buttonCloseName}
                          </button>
                        ) : null}
                      </div>
                    ))}
                </DialogPanel>
              </motion.div>
            </div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
