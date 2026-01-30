'use client'
import { isDev } from '@/src/app/_components/utils/isEnv'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

// Workaround for Next.js middleware hostname normalization bug (issues #48230, #37536).
// NextRequest normalizes 127.0.0.1 to localhost, so middleware redirects can't preserve hostname.
// This client-side fix redirects from localhost back to 127.0.0.1 to prevent CORS errors.
export const DevMiddlewareHostnameWorkaround = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Only redirect once per mount to avoid loops
    if (hasRedirected.current) return

    if (isDev && window.location.hostname === 'localhost' && pathname) {
      const targetOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN!
      const url = new URL(pathname, targetOrigin)
      const searchString = searchParams?.toString()
      const targetUrl = searchString ? `${url.pathname}?${searchString}` : url.pathname
      // Use window.location.replace() to change hostname (router.replace() only changes path)
      const fullTargetUrl = `${new URL(targetOrigin).origin}${targetUrl}`
      hasRedirected.current = true
      window.location.replace(fullTargetUrl)
    }
  }, [pathname, searchParams])

  return null
}
