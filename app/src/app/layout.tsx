import SocialSharingImage from '@/src/app/_components/layouts/assets/og-image-default.jpg'
import { BlitzProvider } from '@/src/blitz-client'
import { Metadata, Viewport } from 'next'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Suspense } from 'react'
import './_components/layouts/global.css'
import { TailwindResponsiveHelper } from './_components/layouts/helper/TailwindResponsiveHelper'
import { isProd } from './_components/utils/isEnv'

// https://nextjs.org/docs/app/building-your-application/optimizing/metadata
// https://nextjs.org/docs/app/api-reference/functions/generate-metadata

export const metadata: Metadata = {
  // 'noindex': No default on Production, but everyting is 'noindex' on Staging & Development
  // For testing, use ...{ robots: true ? undefined : 'noindex' },
  ...{ robots: isProd ? undefined : 'noindex' },
  title: {
    default: 'TILDA – Geodaten für die Verkehrsplanung',
    template: '%s – tilda-geo.de',
  },
  description:
    'TILDA bringt Ihnen Geodaten für die Verkehrsplanung – nachhaltig und für die Nutzung im Team.',
  metadataBase: new URL('https://tilda-geo.de'),
  openGraph: {
    images: [
      {
        url: SocialSharingImage.src,
        height: 630,
        width: 1200,
        alt: 'TILDA bringt Ihnen Geodaten für die Verkehrsplanung – nachhaltig und für die Nutzung im Team.',
      },
    ],
    locale: 'de_DE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@fixmyberlin',
    images: [SocialSharingImage.src],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full">
      <body className="flex min-h-full w-full text-gray-800 antialiased">
        <BlitzProvider>
          <NuqsAdapter>
            <Suspense>
              <div className="relative flex-auto">{children}</div>
            </Suspense>
          </NuqsAdapter>
        </BlitzProvider>
        <TailwindResponsiveHelper />
      </body>
    </html>
  )
}

export const viewport: Viewport = {
  themeColor: '#27272a',
}
