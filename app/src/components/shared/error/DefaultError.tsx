import type { ErrorComponentProps } from '@tanstack/react-router'
import { useEffect } from 'react'
import { logError } from '@/components/shared/error/logError'
import { Link } from '@/components/shared/links/Link'
import { buttonStylesSecondary } from '@/components/shared/links/styles'
import { isDev } from '@/components/shared/utils/isEnv'

export default function DefaultError({ error, reset }: ErrorComponentProps) {
  useEffect(
    function logRouteErrorOnChange() {
      if (error) logError(error, 'route')
    },
    [error],
  )
  return (
    <div className="not-prose flex min-h-full grow flex-col bg-white" role="alert">
      <main className="mx-auto flex w-full max-w-7xl grow flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="py-16">
          <div className="text-center">
            <p className="text-base font-semibold text-amber-500">:-(</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Ein Fehler ist aufgetreten
            </h1>
            <p className="mt-2 text-base text-gray-600">Leider ist ein Fehler aufgetreten.</p>
            {isDev && error?.message && (
              <p className="mt-2 font-mono text-sm wrap-break-word text-gray-700">
                {error.message}
              </p>
            )}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link button to="/">
                Zur Startseite
              </Link>
              {reset && (
                <button type="button" onClick={reset} className={buttonStylesSecondary}>
                  Erneut versuchen
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
