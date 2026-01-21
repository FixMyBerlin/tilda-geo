'use client'
import { CheckBadgeIcon, EyeIcon, PencilSquareIcon } from '@heroicons/react/24/outline'

type Feature = {
  name: string
  summary: string
  description: string
  icon: React.ReactNode
}

const features: Feature[] = [
  {
    name: 'Daten Betrachten',
    summary: 'TILDA visualisiert Daten interaktiv zur direkten Unterstützung der Planung.',
    description:
      'Nutzen Sie die vorhandenen Daten in TILDA zur Planung von Radinfrastruktur oder exportieren Sie die Daten in Ihre Planungsprogramme.',
    icon: <EyeIcon className="text-white" />,
  },
  {
    name: 'Daten prüfen',
    summary: 'Um die Daten amtlich zu nutzen, prüfen Sie diese in einem geführten Prozess.',
    description:
      'Diese Funktion ist nur per Login verfügbar. Sie entscheiden als Kommune, welche Daten ausreichende Qualität haben. Unvollständige oder veraltete Daten werden als Aufgaben an die Bürger:innen übergeben.',
    icon: <CheckBadgeIcon className="text-white" />,
  },
  {
    name: 'Daten verbessern',
    summary:
      'Mit leicht zu bedienenden Editierwerkzeugen können Bürger:innen unvollständige Daten einfach ergänzen.',
    description:
      'Rufen Sie die Bürger:innen zum Mitmachen auf, so können sie lokales Wissen einbringen und konstruktiv beitragen. Die Datenlage verbessert sich nach und nach und wird aktuell gehalten.',
    icon: <PencilSquareIcon className="text-white" />,
  },
]

export const HomePageSecondaryFeaturesJustText = () => {
  return (
    <section id="secondary-features" className="pt-20 pb-14 sm:pt-32 sm:pb-20 lg:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl md:text-center">
          <h2 className="font-display text-3xl tracking-tight text-gray-900 sm:text-4xl">
            Gemeinsam mit Bürger:innen zum Erfolg
          </h2>
          <p className="mt-4 text-lg tracking-tight text-gray-700">
            Die Qualität der Daten lebt von der Beteiligung der Bürger:innen sowie von Ihrer
            Expertise als Verwaltung. Wir bringen beides zusammen.
          </p>
        </div>
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {features.map((feature) => {
            return (
              <div key={feature.name}>
                <div className="w-9 rounded-lg bg-blue-400">
                  <svg aria-hidden="true" className="h-9 w-9 p-2" fill="none">
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="mt-3 text-sm font-medium text-blue-600">{feature.name}</h3>
                <p className="font-display mt-2 text-xl text-gray-900">{feature.summary}</p>
                <p className="mt-3 text-sm text-gray-600">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
