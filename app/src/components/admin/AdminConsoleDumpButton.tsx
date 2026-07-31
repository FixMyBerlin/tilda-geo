import { BugAntIcon } from '@heroicons/react/24/outline'

type Props = {
  data: unknown
  /** Prefix in devtools console. */
  name?: string
}

const buttonClassName =
  'inline-flex shrink-0 items-center justify-center rounded-md h-6 w-6 text-pink-800 transition-colors hover:bg-pink-100 hover:text-pink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500'

export function AdminConsoleDumpButton({ data, name }: Props) {
  const consoleLabel = name ?? 'JSON Dump'

  return (
    <button
      type="button"
      aria-label={`Rohdaten für ${consoleLabel} in Konsole loggen`}
      className={buttonClassName}
      onClick={() => console.log(consoleLabel, data)}
    >
      <BugAntIcon className="size-4" aria-hidden="true" />
    </button>
  )
}
