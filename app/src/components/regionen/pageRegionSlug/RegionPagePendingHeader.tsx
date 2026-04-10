import { twJoin } from 'tailwind-merge'

const pulseBlock = 'animate-pulse rounded-md bg-gray-600/60'

export function RegionPagePendingHeader() {
  return (
    <nav
      className="z-10 w-full shrink-0 bg-gray-800 px-4 shadow-xl sm:px-6 lg:px-8 print:hidden"
      aria-hidden="true"
    >
      <div className="relative flex min-h-16 items-center justify-between gap-4 sm:h-16">
        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <div className={twJoin(pulseBlock, 'size-8 shrink-0')} />
          <div className="min-w-0 space-y-1.5">
            <div className={twJoin(pulseBlock, 'h-3.5 w-36 max-w-[45vw]')} />
            <div className={twJoin(pulseBlock, 'h-2.5 w-24 max-w-[35vw]')} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className={twJoin(pulseBlock, 'size-8 rounded-full')} />
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-md border-2 border-gray-500 sm:hidden"
            aria-hidden="true"
          />
          <div
            className="hidden size-9 shrink-0 items-center justify-center rounded-md border-2 border-gray-500 sm:flex"
            aria-hidden="true"
          />
        </div>
      </div>
    </nav>
  )
}
