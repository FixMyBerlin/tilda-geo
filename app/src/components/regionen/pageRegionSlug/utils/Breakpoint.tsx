import type { ReactNode } from 'react'
import { useBreakpoint } from '@/components/shared/hooks/viewport/useBreakpoint'

/**
 * Render children only at the desktop breakpoint (≥ sm). Below sm it returns null,
 * so the children are not in the DOM at all (unlike CSS `hidden`). No DOM wrapper
 * element is added. Use to place a shared/generic component (e.g. DownloadModal)
 * on one breakpoint without giving that component a breakpoint responsibility it
 * can't own (it's also rendered elsewhere on the other breakpoint).
 *
 * Safe without a hydration flash: the region route renders client-only
 * (`ssr: 'data-only'`), so useBreakpoint is accurate on first paint.
 */
export const DesktopOnly = ({ children }: { children: ReactNode }) => {
  return useBreakpoint('sm') ? <>{children}</> : null
}

/** Render children only below the desktop breakpoint (< sm); null at ≥ sm. */
export const MobileOnly = ({ children }: { children: ReactNode }) => {
  return useBreakpoint('sm') ? null : <>{children}</>
}
