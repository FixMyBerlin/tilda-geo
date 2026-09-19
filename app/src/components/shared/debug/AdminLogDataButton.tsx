import { CommandLineIcon } from '@heroicons/react/20/solid'
import { twMerge } from 'tailwind-merge'
import { useIsAdmin } from '@/components/shared/hooks/useIsAdmin'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'

type Props = {
  data: unknown
  className?: string
}

const label = 'Gibt Debug-Daten in der Browser-Konsole aus (nur für Admins)'

/** Pink admin-only control — logs `data` instead of rendering a JSON dump in the UI. */
export const AdminLogDataButton = ({ data, className }: Props) => {
  const isAdmin = useIsAdmin()
  if (!isAdmin) return null

  return (
    <Tooltip text={label}>
      <button
        type="button"
        onClick={() => console.log(data)}
        aria-label={label}
        className={twMerge(
          'inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-pink-400 bg-pink-300 text-pink-900 shadow-xs hover:bg-pink-400 focus:ring-2 focus:ring-pink-500 focus:outline-none',
          className,
        )}
      >
        <CommandLineIcon className="size-4 shrink-0" aria-hidden />
      </button>
    </Tooltip>
  )
}
