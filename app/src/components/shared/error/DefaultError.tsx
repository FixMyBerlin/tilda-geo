import type { ErrorComponentProps } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Link } from '@/components/shared/links/Link'
import { linkStyles } from '@/components/shared/links/styles'
import { logError } from '@/components/shared/error/logError'
import { isDev } from '@/components/shared/utils/isEnv'
import { twMerge } from 'tailwind-merge'

export default function DefaultError({ error, reset }: ErrorComponentProps) {
  useEffect(
    function logRouteErrorOnChange() {
      if (error) logError(error, 'route')
    },
    [error],
  )
  return (
    <div
      className="not-prose mx-auto flex w-full max-w-4xl flex-col justify-center bg-transparent py-6"
      role="alert"
    >
      <div className="text-center">
        <p className="text-base font-semibold text-amber-500">:-(</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Ein Fehler ist aufgetreten
        </h1>
        <p className="mt-2 text-base text-gray-600">Leider ist ein Fehler aufgetreten.</p>
        {isDev && error?.message && (
          <p className="mt-2 wrap-break-word font-mono text-sm text-gray-700">{error.message}</p>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link button to="/">
            Zur Startseite
            <span aria-hidden="true"> &rarr;</span>
          </Link>
          {reset && (
            <button
              type="button"
              onClick={reset}
              className={twMerge(
                linkStyles,
                'inline-flex items-center justify-center rounded-md border border-gray-400/80 bg-white/90 px-4 py-2 text-base font-semibold text-gray-800 no-underline shadow-sm hover:bg-white',
              )}
            >
              Erneut versuchen
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
