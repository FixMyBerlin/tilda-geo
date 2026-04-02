import type { ErrorComponentProps } from '@tanstack/react-router'
import { useParams } from '@tanstack/react-router'
import { useEffect } from 'react'
import { twMerge } from 'tailwind-merge'
import { logError } from '@/components/shared/error/logError'
import { Link } from '@/components/shared/links/Link'
import { linkStyles } from '@/components/shared/links/styles'
import { isDev } from '@/components/shared/utils/isEnv'

type RegionErrorProps = ErrorComponentProps & {
  /** Used by non-production admin preview routes when `regionSlug` is not in the URL. */
  previewRegionSlug?: string
}

export default function RegionError({ error, reset, previewRegionSlug }: RegionErrorProps) {
  useEffect(
    function logRegionErrorOnChange() {
      if (error) logError(error, 'region')
    },
    [error],
  )

  const params = useParams({ strict: false })
  const regionSlugFromParams = Array.isArray(params?.regionSlug)
    ? params.regionSlug[0]
    : params?.regionSlug
  const regionSlug = previewRegionSlug ?? regionSlugFromParams

  return (
    <div className="not-prose flex min-h-full grow flex-col bg-white">
      <main className="mx-auto flex w-full max-w-7xl grow flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="py-16">
          <div className="text-center">
            <p className="text-base font-semibold text-amber-500">:-(</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Ein Fehler ist aufgetreten
            </h1>
            <p className="mt-2 text-base text-gray-500">Leider ist ein Fehler aufgetreten.</p>
            {isDev && error?.message && (
              <p className="mt-2 font-mono text-sm text-gray-600" role="alert">
                {error.message}
              </p>
            )}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {regionSlug && (
                <Link button to="/regionen/$regionSlug" params={{ regionSlug }}>
                  Region mit Standard-Einstellungen öffnen
                </Link>
              )}
              {reset && (
                <button
                  type="button"
                  onClick={reset}
                  className={twMerge(
                    linkStyles,
                    'inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-semibold text-gray-800 no-underline shadow-sm hover:bg-gray-50',
                  )}
                >
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
