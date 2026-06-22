import type { LinkOptions } from '@tanstack/react-router'
import type { SVGProps } from 'react'
import screenshotFussverkehr from '@/components/home/assets/HomePageLive/fussverkehr.jpg'
import screenshotParkraum from '@/components/home/assets/HomePageLive/parkraum.jpg'
import screenshotRadverkehr from '@/components/home/assets/HomePageLive/radverkehr.jpg'
import { Img } from '@/components/shared/Img'
import { Link } from '@/components/shared/links/Link'
import { Pill } from '@/components/shared/text/Pill'
import type { Router } from '@/router'
import { SvgBicycle } from './icons/SvgBicycle'
import { SvgCar } from './icons/SvgCar'
import { SvgPedestrian } from './icons/SvgPedestrian'

// Verlinkt direkt in eine live nutzbare Region (TILDA „live erleben").
type LiveDemo = {
  to: LinkOptions<Router>['to']
  params?: LinkOptions<Router>['params']
  search?: LinkOptions<Router>['search']
}

type Product = {
  name: string
  icon: (props: SVGProps<SVGSVGElement>) => React.ReactNode
  slogan: string
  description: string
  moreLabel: string
  // Platzhalter, bis es dedizierte Produktseiten gibt.
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
      'Sie erhalten eine umfassende Bestandserfassung mit den von Ihnen gewünschten Attributen. Wenn gewünscht werden die Daten durch 360°-Befahrungen ergänzt – ganz ohne eigenen Aufwand. Darauf aufbauend werden gute Planungsgrundlagen geschaffen.',
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
      params: { regionSlug: 'parkraum' },
      search: { map: '13.5/52.4918/13.4261' } as LinkOptions<Router>['search'],
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
    <section className="border-y border-[#847560]/10 bg-[#ffedbf]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-[#1c1b1f] sm:text-4xl">
          Die TILDA Geodatenprodukte
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base text-[#1c1b1f]/80 sm:text-lg">
          Spezialisierte Lösungen für die kommunale Verkehrsplanung – sofort einsetzbar, günstig im
          Betrieb
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const Icon = product.icon
            return (
              <div
                key={product.name}
                className="flex flex-col overflow-hidden rounded-2xl border border-[#847560]/15 bg-white"
              >
                {product.image && (
                  <Img
                    src={product.image}
                    alt={product.imageAlt ?? ''}
                    loading="lazy"
                    className="aspect-[16/10] w-full border-b border-[#847560]/10 object-cover object-center"
                  />
                )}

                <div className="flex flex-1 flex-col p-7 sm:p-8">
                  <div className="flex items-center gap-4">
                    <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-lg bg-[#fabe48]/10 text-[#7e5700]">
                      <Icon className="size-9" />
                    </span>
                    <h3 className="flex items-center gap-2 text-xl font-semibold text-[#1b1c1c] sm:text-2xl">
                      {product.name}
                      {product.beta && (
                        <Pill color="amberSoft" className="rounded py-0.5 font-semibold">
                          beta
                        </Pill>
                      )}
                    </h3>
                  </div>

                  <p className="mt-6 text-lg font-medium text-[#1b1c1c]">{product.slogan}</p>
                  <p className="mt-3 text-[15px] leading-relaxed text-[#514532]">
                    {product.description}
                  </p>

                  <div className="mt-auto flex flex-col items-center gap-3 pt-6">
                    <Link
                      href={product.moreHref}
                      classNameOverwrite="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#ffb400] px-6 py-3 text-base font-medium text-[#1b1c1c] no-underline shadow-lg transition-colors select-none hover:bg-[#f3ab00] focus-visible:ring-2 focus-visible:ring-[#7e5700]/40 focus-visible:outline-none active:bg-[#e0a800]"
                      blank
                    >
                      {product.moreLabel}
                    </Link>
                    {product.liveDemo && (
                      <Link
                        to={product.liveDemo.to}
                        params={product.liveDemo.params}
                        search={product.liveDemo.search}
                        classNameOverwrite="text-center text-sm font-medium text-[#7e5700] underline underline-offset-4 transition-colors hover:text-[#5c4000] focus-visible:ring-2 focus-visible:ring-[#7e5700]/30 focus-visible:outline-none"
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
