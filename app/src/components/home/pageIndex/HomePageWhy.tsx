import {
  ArrowPathIcon,
  ArrowTrendingDownIcon,
  BoltIcon,
  CodeBracketIcon,
  ShieldCheckIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import type { ComponentType, SVGProps } from 'react'
import { Pill } from '@/components/shared/text/Pill'

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
    description: 'Kommentieren oder Teilen – alles in einem Browser-Tab. Keine Installation nötig.',
    icon: UsersIcon,
  },
  {
    badge: 'Kosteneffizient',
    title: 'Budget-Schonend',
    description:
      'Reduzieren Sie den Bedarf an teuren, externen Erfassungen durch eigene, valide Datengrundlagen.',
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
      'Kein Vendor-Lock-in. Die gesamte Software ist quelloffen – Ihre Daten gehören Ihnen. Datensouveränität garantiert.',
    icon: CodeBracketIcon,
  },
]

export const HomePageWhy = () => {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-[#1b1c1c] sm:text-4xl">
          Warum TILDA?
        </h2>
        <p className="mt-4 text-center text-base text-[#514532] sm:text-lg">
          Datenbasiert planen, nachhaltig handeln
        </p>

        <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="flex flex-col items-center text-center">
                <span className="inline-flex size-24 items-center justify-center rounded-full bg-[#7e5700]/8 text-[#6b4900]">
                  <Icon className="size-12" />
                </span>
                <Pill color="amber" className="mt-4 rounded-full px-4 py-1 text-sm font-semibold">
                  {feature.badge}
                </Pill>
                <h3 className="mt-3 text-2xl font-semibold text-[#1b1c1c]">{feature.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#514532]">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
