import { twMerge } from 'tailwind-merge'

type Props = {
  from: number
  to: number
  count: number
  canGoPrevious: boolean
  canGoNext: boolean
  onPrevious: () => void
  onNext: () => void
  className?: string
}

const buttonClassName =
  'relative inline-flex items-center rounded-md bg-white/90 px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-pink-500/40 hover:bg-pink-50'

const disabledButtonClassName =
  'relative inline-flex cursor-not-allowed items-center rounded-md bg-white/50 px-3 py-2 text-sm font-semibold text-gray-400 ring-1 ring-inset ring-pink-500/20'

export const PaginationNav = ({
  from,
  to,
  count,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  className,
}: Props) => {
  return (
    <nav
      aria-label="Seitennummerierung"
      className={twMerge(
        'flex items-center justify-between border-t border-pink-500/25 bg-white/90 px-4 py-3 sm:px-6',
        className,
      )}
    >
      <div className="hidden sm:block">
        {count === 0 ? (
          <p className="text-sm text-gray-700">Keine Einträge</p>
        ) : (
          <p className="text-sm text-gray-700">
            Zeige <span className="font-medium">{from}</span> bis{' '}
            <span className="font-medium">{to}</span> von{' '}
            <span className="font-medium">{count}</span> Einträgen
          </p>
        )}
      </div>
      <div className="flex flex-1 justify-between sm:justify-end">
        {canGoPrevious ? (
          <button type="button" className={buttonClassName} onClick={onPrevious}>
            Zurück
          </button>
        ) : (
          <span className={disabledButtonClassName}>Zurück</span>
        )}
        {canGoNext ? (
          <button type="button" className={`${buttonClassName} ml-3`} onClick={onNext}>
            Weiter
          </button>
        ) : (
          <span className={`${disabledButtonClassName} ml-3`}>Weiter</span>
        )}
      </div>
    </nav>
  )
}
