import { useEffect } from 'react'
import { isDev } from '@/components/shared/utils/isEnv'
import { RegionPagePendingHeader } from './RegionPagePendingHeader'
import { RegionPagePendingMapShell } from './RegionPagePendingMapShell'

type Props = {
  previewRegionSlug?: string
}

export default function RegionPagePending({ previewRegionSlug }: Props = {}) {
  useEffect(function logRegionPendingInDev() {
    if (isDev) console.debug('[region] route pending UI shown')
  }, [])

  return (
    <div
      // Mirrors PageRegionSlug's full-bleed lock: measured visible height with a 100dvh fallback.
      className="flex h-(--app-height,100dvh) min-h-0 w-full flex-col bg-white"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Dark header is desktop-only; mobile shows the floating-button skeleton (see RegionPagePendingMapShell). */}
      <div className="hidden sm:block">
        <RegionPagePendingHeader />
      </div>
      <main className="z-0 min-h-0 grow">
        <RegionPagePendingMapShell previewRegionSlug={previewRegionSlug} />
      </main>
    </div>
  )
}
