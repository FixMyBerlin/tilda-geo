import type { SVGProps } from 'react'
import { Link } from '@/components/shared/links/Link'
import { SvgBicycle } from './icons/SvgBicycle'
import { SvgCar } from './icons/SvgCar'
import { SvgPedestrian } from './icons/SvgPedestrian'
import { homeCtaPrimary } from './styles'

type Product = {
  name: string
  icon: (props: SVGProps<SVGSVGElement>) => React.ReactNode
  slogan: string
  description: string
  moreLabel: string
  // Platzhalter, bis es dedizierte Produktseiten gibt.
  moreHref: `https://${string}`
  beta?: boolean
}

const products: Product[] = [
  {
    name: 'TILDA Radverkehr',
    icon: SvgBicycle,
    slogan: 'Radinfrastruktur planen – präzise und rechtssicher',
    description:
      'Analysieren Sie Lücken im Netz und planen Sie neue Radwege auf Basis von Echtzeit-Infrastrukturdaten.',
    moreLabel: 'Mehr Infos',
    moreHref: 'https://www.fixmycity.de/tilda',
  },
  {
    name: 'TILDA Parkraum',
    icon: SvgCar,
    slogan: 'Parkraummanagement mit Präzision',
    description:
      'Erfassen und verwalten Sie Parkflächen systematisch mit 360°-Befahrungen und intelligenten Analysetools.',
    moreLabel: 'Mehr erfahren',
    moreHref: 'https://www.fixmycity.de/tilda',
  },
  {
    name: 'TILDA Fußverkehr',
    icon: SvgPedestrian,
    slogan: 'Die digitale Grundlage für Ihr gesamtes Netz',
    description:
      'Wir bereiten komplexe Geodaten so auf, dass Sie sofort loslegen können. Führungsformen, Oberflächenbeschaffenheit und Breiten sind standardisiert erfasst.',
    moreLabel: 'Mehr erfahren',
    moreHref: 'https://www.fixmycity.de/tilda',
    beta: true,
  },
]

export const HomePageProducts = () => {
  return (
    <section className="mt-24 w-full bg-yellow-50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <h2 className="font-display text-center text-3xl tracking-tight text-gray-900 sm:text-4xl">
          Die TILDA Geodatenprodukte
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg tracking-tight text-gray-700">
          Spezialisierte Lösungen für die kommunale Verkehrsplanung – sofort einsetzbar, günstig im
          Betrieb
        </p>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {products.map((product) => {
            const Icon = product.icon
            return (
              <div
                key={product.name}
                className="flex flex-col rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
                    <Icon className="h-7 w-7" />
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                  {product.beta && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      beta
                    </span>
                  )}
                </div>

                <p className="mt-5 font-semibold text-gray-900">{product.slogan}</p>
                <p className="mt-2 text-sm tracking-tight text-gray-600">{product.description}</p>

                <div className="mt-6 flex flex-col items-center gap-3">
                  <Link href={product.moreHref} button className={`${homeCtaPrimary} w-full`} blank>
                    {product.moreLabel}
                  </Link>
                  <Link href="https://www.fixmycity.de/termin-vereinbaren" blank>
                    Demo anfragen
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
