import { ChevronRightIcon } from '@heroicons/react/24/outline'
import { type ReactNode, useState } from 'react'
import { MobileBottomSheet } from '@/components/regionen/pageRegionSlug/mobile/MobileBottomSheet'
import { AnimatedNumber } from '@/components/shared/motion/AnimatedNumber'

type Props = {
  /** Metric label shown above the number (or a generic title when no areas). */
  label: string
  /** Raw total (animated count-up), or null to show the "draw areas" prompt instead. */
  total: number | null
  /** Formats the total for display. */
  formatTotal: (value: number) => string
  /** The breakdown, shown inside the sheet when opened. */
  children: ReactNode
}

/**
 * Mobile calculator entry point: a compact pill on the map showing the total, which opens
 * the full breakdown in a bottom sheet (so the table no longer covers the map). Owns its
 * own open state — the parent only provides the headline label/total and the breakdown.
 */
export const CalculatorMobileSummary = ({ label, total, formatTotal, children }: Props) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Collapsed pill below the draw toolbar. The ">" chevron signals "tap to open". */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Summierung anzeigen"
        className="absolute top-29 left-2 z-1000 flex max-w-[75vw] items-center gap-3 rounded-md bg-fuchsia-800/90 py-1.5 pr-2 pl-3 text-left text-white shadow-xl active:bg-fuchsia-700"
      >
        <span className="flex min-w-0 flex-col items-start">
          <span className="truncate text-[0.6rem] font-semibold tracking-wide text-white/80 uppercase">
            {label}
          </span>
          {total !== null ? (
            <span className="text-base leading-tight font-bold tabular-nums">
              <AnimatedNumber value={total} format={formatTotal} />
            </span>
          ) : (
            <span className="text-xs">Flächen zeichnen</span>
          )}
        </span>
        <ChevronRightIcon className="size-5 shrink-0 text-white/70" aria-hidden="true" />
      </button>

      <MobileBottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Summierung"
        tone="calculator"
      >
        <div className="px-4 pb-4">{children}</div>
      </MobileBottomSheet>
    </>
  )
}
