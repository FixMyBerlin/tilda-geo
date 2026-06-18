import {
  ArrowPathIcon,
  ArrowTrendingDownIcon,
  BoltIcon,
  CodeBracketIcon,
  ShieldCheckIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import type { ComponentType, SVGProps } from 'react'
import { Link } from '@/components/shared/links/Link'
import { buttonStylesSecondary } from '@/components/shared/links/styles'
import { homeCtaPrimary } from './styles'

type Feature = {
  badge: string
  title: string
  description: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

const features: Feature[] = [
  {
    badge: 'Keine Abhängigkeit',
    title: 'Zukunftssicher',
    description:
      'Offene Daten (OSM) bedeuten kein Vendor-Lock-in. Die Daten gehören der Allgemeinheit und Ihnen.',
    icon: ShieldCheckIcon,
  },
  {
    badge: 'Kollaborativ',
    title: 'Teamplayer',
    description:
      'Kommentieren, Teilen, Analysieren – alles in einem Browser-Tab. Keine Installation nötig.',
    icon: UsersIcon,
  },
  {
    badge: 'Kosteneffizient',
    title: 'Budget-Schonend',
    description:
      'Reduzieren Sie den Bedarf an externen Gutachten durch eigene, valide Datengrundlagen.',
    icon: ArrowTrendingDownIcon,
  },
  {
    badge: 'Keine Abhängigkeit',
    title: 'Sofort startklar',
    description:
      'Keine IT-Kenntnisse erforderlich. Daten sind von Tag 1 an in der Cloud verfügbar und nutzbar.',
    icon: BoltIcon,
  },
  {
    badge: 'Kollaborativ',
    title: 'Ohne Neubefahrungen',
    description:
      'OSM-basierte Daten bleiben tagesaktuell. Nur Änderungen werden eingetragen – keine teuren Wiederholungsbefahrungen.',
    icon: ArrowPathIcon,
  },
  {
    badge: 'Kosteneffizient',
    title: 'Open Source',
    description:
      'Kein Vendor-Lock-in. Die gesamte Software ist quelloffen – Ihre Daten gehören Ihnen.',
    icon: CodeBracketIcon,
  },
]

export const HomePageWhy = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <h2 className="font-display text-center text-3xl tracking-tight text-gray-900 sm:text-4xl">
        Warum TILDA?
      </h2>
      <p className="mt-4 text-center text-lg tracking-tight text-gray-700">
        Nachhaltigkeit und Effizienz im Fokus
      </p>

      <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <div key={feature.title} className="flex flex-col items-center text-center">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                <Icon className="h-8 w-8" />
              </span>
              <span className="mt-4 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                {feature.badge}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 max-w-xs text-sm tracking-tight text-gray-600">
                {feature.description}
              </p>
            </div>
          )
        })}
      </div>

      <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link href="https://www.fixmycity.de/tilda" button className={homeCtaPrimary} blank>
          Mehr erfahren
        </Link>
        <Link to="/regionen" classNameOverwrite={buttonStylesSecondary}>
          Beispiel Region ansehen
        </Link>
      </div>
    </section>
  )
}
