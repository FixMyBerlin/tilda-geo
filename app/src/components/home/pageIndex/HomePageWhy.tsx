import {
  ArrowPathIcon,
  ArrowTrendingDownIcon,
  BoltIcon,
  CodeBracketIcon,
  ShieldCheckIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import type { ComponentType, SVGProps } from 'react'
import { ScrollReveal } from '@/components/shared/motion/ScrollReveal'

type Feature = {
  title: string
  description: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

const features: Feature[] = [
  {
    title: 'Zukunftssicher',
    description:
      'Offene Daten (OSM) bedeuten kein Vendor-Lock-in. Die Daten gehören der Allgemeinheit und Ihnen.',
    icon: ShieldCheckIcon,
  },
  {
    title: 'Teamplayer',
    description: 'Kommentieren und teilen – alles in einem Browser-Tab. Keine Installation nötig.',
    icon: UsersIcon,
  },
  {
    title: 'Budget-schonend',
    description:
      'Reduzieren Sie den Bedarf an teuren, externen Erfassungen durch eigene, valide Datengrundlagen.',
    icon: ArrowTrendingDownIcon,
  },
  {
    title: 'Sofort startklar',
    description:
      'Keine IT-Kenntnisse erforderlich. Daten sind von Tag 1 an in der Cloud verfügbar und nutzbar.',
    icon: BoltIcon,
  },
  {
    title: 'Ohne Neubefahrungen',
    description:
      'OSM-basierte Daten werden regelmäßig aktualisiert. Nur Änderungen werden eingetragen – keine teuren Wiederholungsbefahrungen.',
    icon: ArrowPathIcon,
  },
  {
    title: 'Open Source',
    description:
      'Kein Vendor-Lock-in. Die gesamte Software ist quelloffen – Ihre Daten gehören Ihnen. Datensouveränität garantiert.',
    icon: CodeBracketIcon,
  },
]

export const HomePageWhy = () => {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <ScrollReveal className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            Warum TILDA?
          </h2>
          <p className="mt-4 text-base text-gray-700 sm:text-lg">
            Datenbasiert planen, nachhaltig handeln
          </p>
        </ScrollReveal>

        <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              // Staggered scroll-in; the icon scales gently when its card is hovered.
              <ScrollReveal
                key={feature.title}
                delay={0.1 + index * 0.08}
                className="group flex flex-col items-center text-center"
              >
                <span className="inline-flex size-24 items-center justify-center rounded-full bg-yellow-800/8 text-yellow-900 transition-transform duration-200 motion-safe:group-hover:scale-105">
                  <Icon className="size-12" />
                </span>
                <h3 className="mt-5 text-2xl font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-700">
                  {feature.description}
                </p>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
