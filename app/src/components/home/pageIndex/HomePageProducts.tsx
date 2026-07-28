import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import type { LinkOptions } from '@tanstack/react-router'
import type { ComponentType, SVGProps } from 'react'
import screenshotFussverkehr from '@/components/home/assets/HomePageProducts/fussverkehr.jpg'
import screenshotParkraum from '@/components/home/assets/HomePageProducts/parkraum.jpg'
import screenshotRadverkehr from '@/components/home/assets/HomePageProducts/radverkehr.jpg'
import { Img } from '@/components/shared/Img'
import { Link } from '@/components/shared/links/Link'
import { Pill } from '@/components/shared/text/Pill'
import type { Router } from '@/router'
import { SvgBicycle } from './icons/SvgBicycle'
import { SvgCar } from './icons/SvgCar'
import { SvgPedestrian } from './icons/SvgPedestrian'

// Links directly to a live region (TILDA "live experience").
type LiveDemo = {
  to: LinkOptions<Router>['to']
  params?: LinkOptions<Router>['params']
  search?: LinkOptions<Router>['search']
}

type Product = {
  name: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  slogan: string
  description: string
  moreLabel: string
  // Placeholder until dedicated product pages exist.
  moreHref: `https://${string}`
  beta?: boolean
  image?: string
  imageAlt?: string
  liveDemo?: LiveDemo
}

const products: Product[] = [
  {
    name: 'TILDA Radverkehr',
    icon: SvgBicycle,
    slogan: 'Radinfrastruktur – erfassen, bewerten und planen',
    description:
      'Sie erhalten eine umfassende Bestandserfassung mit den von Ihnen gewünschten Attributen. Wenn gewünscht, werden die Daten durch 360°-Befahrungen ergänzt – ganz ohne eigenen Aufwand. Darauf aufbauend werden gute Planungsgrundlagen geschaffen.',
    moreLabel: 'Mehr erfahren',
    moreHref: 'https://fixmycity.de/tilda-radverkehr/',
    image: screenshotRadverkehr,
    imageAlt: 'TILDA Radverkehr: Radnetzdaten im Land Brandenburg',
    liveDemo: { to: '/regionen/$regionSlug', params: { regionSlug: 'bb-kampagne' } },
  },
  {
    name: 'TILDA Parkraum',
    icon: SvgCar,
    slogan: 'Parkraummanagement mit Präzision',
    description:
      'TILDA Parkraum liefert Kommunen und Landkreisen eine aktuelle Datengrundlage für das Parkraummanagement. Die Plattform macht Stellplätze, Parkregelungen und Flächenpotenziale sichtbar und unterstützt eine fundierte und transparente Verkehrsplanung.',
    moreLabel: 'Mehr erfahren',
    moreHref: 'https://fixmycity.de/tilda-parkraum/',
    image: screenshotParkraum,
    imageAlt: 'TILDA Parkraum: Parkraumdaten in Berlin',
    liveDemo: {
      to: '/regionen/$regionSlug',
      params: { regionSlug: 'parkraum-berlin' },
      search: {
        map: '14.8/52.4694/13.3311',
        config: '1p5jpsu.i19t0l.2zus',
        v: 2,
      } as LinkOptions<Router>['search'],
    },
  },
  {
    name: 'TILDA Fußverkehr',
    icon: SvgPedestrian,
    slogan: 'Die digitale Grundlage für Ihr gesamtes Netz',
    description:
      'TILDA Fußverkehr erfasst und analysiert die Infrastruktur für das Zufußgehen. So erhalten Kommunen und Landkreise eine verlässliche Grundlage, um Barrierefreiheit zu verbessern, sichere Wege zu schaffen und den öffentlichen Raum fußgängerfreundlich zu gestalten.',
    moreLabel: 'Mehr erfahren',
    moreHref: 'https://fixmycity.de/tilda',
    image: screenshotFussverkehr,
    imageAlt: 'TILDA Fußverkehr: Fußverkehrsnetz mit Führungsformen',
    beta: true,
  },
]

export const HomePageProducts = () => {
  return (
    <section className="border-y border-gray-500/10 bg-brand-light">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
          Die TILDA-Geodatenprodukte
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base text-gray-900/80 sm:text-lg">
          Spezialisierte Lösungen für die kommunale Verkehrsplanung – sofort einsetzbar, günstig im
          Betrieb
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const Icon = product.icon
            return (
              <div
                key={product.name}
                className="flex flex-col overflow-hidden rounded-2xl border border-gray-500/15 bg-white"
              >
                {product.image && (
                  <div className="relative">
                    <Img
                      src={product.image}
                      alt={product.imageAlt ?? ''}
                      loading="lazy"
                      className="aspect-[16/10] w-full border-b border-gray-500/10 object-cover object-center"
                    />
                    {product.beta && (
                      <Pill
                        color="amber"
                        className="absolute top-3 right-3 rounded py-0.5 font-semibold shadow-sm"
                      >
                        beta
                      </Pill>
                    )}
                  </div>
                )}

                <div className="flex flex-1 flex-col p-7 sm:p-8">
                  <div className="flex items-center gap-4">
                    <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-yellow-800">
                      <Icon className="size-9" />
                    </span>
                    <h3 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                      {product.name}
                    </h3>
                  </div>

                  <p className="mt-3 text-lg leading-snug font-medium text-gray-900">
                    {product.slogan}
                  </p>
                  <p className="mt-3 text-[15px] leading-normal text-gray-700">
                    {product.description}
                  </p>

                  <div className="mt-auto flex flex-col items-center gap-3 pt-6">
                    <Link
                      href={product.moreHref}
                      classNameOverwrite="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-6 py-3 text-base font-medium text-gray-900 no-underline shadow-lg transition-colors select-none hover:bg-brand/70 focus-visible:ring-2 focus-visible:ring-yellow-800/40 focus-visible:outline-none active:bg-brand/70"
                      blank
                    >
                      {product.moreLabel}
                      <ArrowTopRightOnSquareIcon className="size-5" aria-hidden />
                    </Link>
                    {product.liveDemo && (
                      <Link
                        to={product.liveDemo.to}
                        params={product.liveDemo.params}
                        search={product.liveDemo.search}
                        classNameOverwrite="text-center text-sm font-medium text-yellow-800 underline underline-offset-4 transition-colors hover:text-yellow-900 focus-visible:ring-2 focus-visible:ring-yellow-800/30 focus-visible:outline-none"
                      >
                        Live Demo ausprobieren
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
