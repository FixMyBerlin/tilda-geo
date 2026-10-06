import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { AnimatePresence, motion, useDragControls } from 'motion/react'
import type { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'
import { SheetGrabHandle } from './SheetGrabHandle'

/** Sheet color schemes — panel bg + grab capsule tint per use. */
type SheetTone = 'default' | 'calculator' | 'debug'

const toneStyles: Record<SheetTone, { panel: string; grabber: string; grabIcon: string }> = {
  default: { panel: 'bg-white', grabber: 'bg-gray-300', grabIcon: 'text-gray-600' },
  calculator: {
    panel: 'bg-fuchsia-800 text-white',
    grabber: 'bg-white/40',
    grabIcon: 'text-white',
  },
  debug: {
    panel: 'bg-pink-300 text-pink-950',
    grabber: 'bg-pink-500/50',
    grabIcon: 'text-pink-950',
  },
}

/** How much of the map stays visible above the sheet. */
type SheetMapPeek = 'minimal' | '10%' | '15%' | '20%'

const maxHeightByPeek: Record<SheetMapPeek, string> = {
  minimal: 'max-h-[100dvh]',
  '10%': 'max-h-[90dvh]',
  '15%': 'max-h-[85dvh]',
  '20%': 'max-h-[80dvh]',
}

type Props = {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  /** Pinned below the scroll area (e.g. primary CTA that must stay visible). */
  footer?: ReactNode
  /** How much map to leave visible above the sheet (default `minimal` ≈ full height). */
  mapPeek?: SheetMapPeek
  /** Color scheme of the sheet chrome (default white). Content colors are the child's job. */
  tone?: SheetTone
  /** Overrides `tone` panel classes (e.g. region welcome uses gray-900 chrome). */
  panelClassName?: string
  /** Overrides `tone` grabber classes. */
  grabberClassName?: string
  /** Overrides `tone` grab-icon color (e.g. welcome dark chrome). */
  grabIconClassName?: string
}

/**
 * Reusable mobile bottom sheet: slides up from the bottom (nearly full height by
 * default so content gets maximum room), and can be dismissed by swiping the grab
 * handle down, tapping the grab+button, tapping the backdrop, or Escape. The title
 * is visually hidden (`sr-only`) but kept for a11y.
 *
 * HeadlessUI `Dialog` provides the a11y plumbing (focus trap, Escape, outside
 * click, scroll lock); Motion provides the slide + drag-to-dismiss gesture.
 * Drag is initiated only from the grab handle so it does not fight scrollable content.
 */
export const MobileBottomSheet = ({
  open,
  onClose,
  title,
  children,
  footer,
  mapPeek = 'minimal',
  tone = 'default',
  panelClassName,
  grabberClassName,
  grabIconClassName,
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
            <motion.div
              className={twMerge(
                'flex w-full flex-col overflow-hidden rounded-t-xl shadow-xl',
                toneStyle.panel,
                panelClassName,
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
                <SheetGrabHandle
                  onClick={onClose}
                  onPointerDown={(event) => dragControls.start(event)}
                  ariaLabel="Schließen"
                  pillClassName={twMerge(toneStyle.grabber, grabberClassName)}
                  iconClassName={twMerge(toneStyle.grabIcon, grabIconClassName)}
                  direction="down"
                />
                <DialogTitle className="sr-only">{title}</DialogTitle>

                <div
                  className={twMerge(
                    'min-h-0 flex-1 overflow-y-auto overscroll-contain',
                    !footer && 'pb-[env(safe-area-inset-bottom)]',
                  )}
                >
                  {children}
                </div>
                {footer ? (
                  <div className="shrink-0 pb-[env(safe-area-inset-bottom)]">{footer}</div>
                ) : null}
              </DialogPanel>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
