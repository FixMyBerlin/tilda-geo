import type { LinkOptions } from '@tanstack/react-router'
import screenshotNudafa from '@/components/home/assets/HomePageLive/nudafa.jpg'
import screenshotParkraum from '@/components/home/assets/HomePageLive/parkraum.jpg'
import screenshotRadverkehr from '@/components/home/assets/HomePageLive/radverkehr.jpg'
import { Img } from '@/components/shared/Img'
import { Link } from '@/components/shared/links/Link'
import type { Router } from '@/router'

type Callout =
  | {
      name: string
      description: string
      image: string
      imageAlt: string
      to: LinkOptions<Router>['to']
      params?: LinkOptions<Router>['params']
      search?: LinkOptions<Router>['search']
    }
  | {
      name: string
      description: string
      image: string
      imageAlt: string
      href: `https://${string}`
    }

const callouts: Callout[] = [
  {
    name: 'TILDA Radverkehr',
    description: 'Daten für die Planung des Radnetz im Land Brandenburg',
    image: screenshotRadverkehr,
    imageAlt: 'TILDA Radverkehr – Radnetz Brandenburg Kampagne',
    to: '/regionen/$regionSlug',
    params: { regionSlug: 'bb-kampagne' },
  },
  {
    name: 'TILDA Radverkehr',
    description: 'NUDAFA — Interkommunale Radnetzplanung.',
    image: screenshotNudafa,
    imageAlt: 'TILDA Radverkehr – NUDAFA Interkommunale Radnetzplanung',
    href: 'https://www.nudafa.de/radnetzplanung',
  },
  {
    name: 'TILDA Parkraum',
    description: 'Parkraumdaten Berlin',
    image: screenshotParkraum,
    imageAlt: 'TILDA Parkraum – Parkraumdaten Berlin',
    to: '/regionen/$regionSlug',
    params: { regionSlug: 'parkraum' },
    search: { map: '13.5/52.4918/13.4261' } as LinkOptions<Router>['search'],
  },
]

export const HomePageLive = () => {
  return (
    <section className="mt-28 w-full bg-gray-100">
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8 lg:py-28">
        <h2 className="font-display text-3xl tracking-tight text-gray-900 sm:text-4xl">
          TILDA live erleben
        </h2>
        <p className="mt-4 text-lg tracking-tight text-gray-700">
          Hier können Sie Projekte von bestehenden Kunden live erleben:
        </p>

        <div className="mt-6 justify-center space-y-10 lg:flex lg:space-y-0 lg:gap-x-6">
          {callouts.map((callout) => (
            <Link
              key={`${callout.name}-${callout.description}`}
              classNameOverwrite="group relative block lg:max-w-104"
              {...('href' in callout
                ? { href: callout.href }
                : { to: callout.to, params: callout.params, search: callout.search })}
            >
              <div className="sm:aspect-w-2 sm:aspect-h-1 lg:aspect-w-1 lg:aspect-h-1 relative h-80 w-full overflow-hidden rounded-lg bg-white group-hover:opacity-75 sm:h-64">
                <Img
                  src={callout.image}
                  alt={callout.imageAlt}
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <h3 className="mt-6 text-base font-semibold text-gray-900 group-hover:underline">
                {callout.name}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                <span className="absolute inset-0" />
                {callout.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
