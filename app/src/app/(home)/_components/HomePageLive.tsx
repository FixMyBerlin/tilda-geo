import { LinkExternal } from '@/src/app/_components/links/LinkExternal'
import Image, { StaticImageData } from 'next/image'
import screenshotNudafa from './assets/HomePageLive/nudafa.jpg'
import screenshotParkraum from './assets/HomePageLive/parkraum.jpg'
import screenshotRadverkehr from './assets/HomePageLive/radverkehr.jpg'

type Callout = {
  name: string
  description: string
  image: StaticImageData
  imageAlt: string
  href: string
}

const callouts: Callout[] = [
  {
    name: 'TILDA Radverkehr',
    description: 'Daten für die Planung des Radnetz im Land Brandenburg',
    image: screenshotRadverkehr,
    imageAlt: '',
    href: '/regionen/bb-kampagne',
  },
  {
    name: 'TILDA Radverkehr',
    description: 'NUDAFA — Interkommunale Radnetzplanung.',
    image: screenshotNudafa,
    imageAlt: '',
    href: 'https://www.nudafa.de/radnetzplanung',
  },
  {
    name: 'TILDA Parkraum',
    description: 'Parkraumdaten Berlin',
    image: screenshotParkraum,
    imageAlt: '',
    href: '/regionen/parkraum?map=13.5%2F52.4918%2F13.4261',
  },
]

export const HomePageLive = () => {
  return (
    <section className="mx-auto mt-28 max-w-7xl bg-gray-100 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl py-16 text-center sm:py-24 lg:max-w-none lg:py-28">
        <h2 className="font-display text-3xl tracking-tight text-gray-900 sm:text-4xl">
          TILDA live erleben
        </h2>
        <p className="mt-4 text-lg tracking-tight text-gray-700">
          Hier können Sie Projekte von bestehenden Kunden live erleben:
        </p>

        <div className="mt-6 justify-center space-y-10 lg:flex lg:space-y-0 lg:gap-x-6">
          {callouts.map((callout) => (
            <LinkExternal
              href={callout.href}
              key={callout.name}
              classNameOverwrite="group relative block lg:max-w-[26rem]"
            >
              <div className="sm:aspect-w-2 sm:aspect-h-1 lg:aspect-w-1 lg:aspect-h-1 relative h-80 w-full overflow-hidden rounded-lg bg-white group-hover:opacity-75 sm:h-64">
                <Image
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
            </LinkExternal>
          ))}
        </div>
      </div>
    </section>
  )
}
