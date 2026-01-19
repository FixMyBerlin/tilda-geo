import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { CheckBadgeIcon, EyeIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import Image, { StaticImageData } from 'next/image'
import { twJoin, twMerge } from 'tailwind-merge'
import {
  default as screenshotCheck,
  default as screenshotImprove,
  default as screenshotView,
} from './images/HomePageSecondaryFeatures/placeholder.png'

type TFeature = {
  name: string | React.ReactNode
  summary: string
  description: string
  image: StaticImageData
  icon: React.ReactNode
}

const features: TFeature[] = [
  {
    name: 'Daten Betrachten',
    summary: 'TILDA visualisiert Daten interaktiv zur direkten Unterstützung der Planung.',
    description:
      'Nutzen Sie die vorhandenen Daten in TILDA Radverkehr zur Planung von Radinfrastruktur oder exportieren Sie die Daten in Ihre Planungsprogramme.',
    image: screenshotView,
    icon: <EyeIcon className="text-white" />,
  },
  {
    name: 'Daten prüfen',
    summary: 'Um die Daten amtlich zu nutzen, prüfen Sie diese in einem geführten Prozess.',
    description:
      'Diese Funktion ist nur per Login verfügbar. Sie entscheiden als Kommune, welche Daten ausreichende Qualität haben. Unvollständige oder veraltete Daten werden als Aufgaben an die Bürger:innen übergeben.',
    image: screenshotCheck,
    icon: <CheckBadgeIcon className="text-white" />,
  },
  {
    name: 'Daten verbessern',
    summary:
      'Mit leicht zu bedienenden Editierwerkzeugen können Bürger:innen unvollständige Daten einfach ergänzen.',
    description:
      'Rufen Sie die Bürger:innen zum Mitmachen auf, so können sie lokales Wissen einbringen und konstruktiv beitragen. Die Datenlage verbessert sich nach und nach und wird aktuell gehalten.',
    image: screenshotImprove,
    icon: <PencilSquareIcon className="text-white" />,
  },
]

function Feature({
  feature,
  isActive,
  className,
  ...props
}: {
  feature: TFeature
  isActive: boolean
  className: string
}) {
  return (
    <div className={twMerge(className, isActive ? '' : 'opacity-75 hover:opacity-100')} {...props}>
      <div className={twJoin('w-9 rounded-lg', isActive ? 'bg-blue-600' : 'bg-gray-500')}>
        <svg aria-hidden="true" className="h-9 w-9 p-2" fill="none">
          {feature.icon}
        </svg>
      </div>
      <h3
        className={twJoin('mt-3 text-sm font-medium', isActive ? 'text-blue-600' : 'text-gray-600')}
      >
        {feature.name}
      </h3>
      <p className="font-display mt-2 text-xl text-gray-900">{feature.summary}</p>
      <p className="mt-3 text-sm text-gray-600">{feature.description}</p>
    </div>
  )
}

const FeaturesMobile = () => {
  return (
    <div className="-mx-4 mt-20 flex flex-col gap-y-10 overflow-hidden px-4 sm:-mx-6 sm:px-6 lg:hidden">
      {features.map((feature, featureIndex) => (
        <div key={featureIndex}>
          <Feature feature={feature} className="mx-auto max-w-2xl" isActive />
          <div className="relative mt-10 pb-10">
            <div className="absolute -inset-x-4 top-8 bottom-0 bg-gray-200 sm:-inset-x-6" />
            <div className="relative mx-auto w-[52.75rem] overflow-hidden rounded-xl bg-white shadow-lg ring-1 shadow-gray-900/5 ring-gray-500/10">
              <Image
                src={feature.image}
                className="w-full"
                style={{
                  width: '52.75rem',
                  height: '52.75rem',
                }}
                alt=""
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const FeaturesDesktop = () => {
  return (
    <TabGroup as="div" className="hidden lg:mt-20 lg:block">
      {({ selectedIndex }) => (
        <>
          <TabList className="grid grid-cols-3 gap-x-8">
            {features.map((feature, featureIndex) => (
              <Feature
                key={featureIndex}
                feature={{
                  ...feature,
                  name: (
                    <Tab className="[&:not(:focus-visible)]:focus:outline-none">
                      <span className="absolute inset-0" />
                      {feature.name}
                    </Tab>
                  ),
                }}
                isActive={featureIndex === selectedIndex}
                className="relative"
              />
            ))}
          </TabList>
          <TabPanels className="relative mt-12 overflow-hidden rounded-4xl bg-gray-200 px-14 py-16 xl:px-16">
            <div className="-mx-5 flex">
              {features.map((feature, featureIndex) => (
                <TabPanel
                  static
                  key={featureIndex}
                  className={twJoin(
                    'px-5 transition duration-500 ease-in-out [&:not(:focus-visible)]:focus:outline-none',
                    featureIndex !== selectedIndex ? 'opacity-60' : '',
                  )}
                  style={{ transform: `translateX(-${selectedIndex * 100}%)` }}
                  aria-hidden={featureIndex !== selectedIndex}
                >
                  <div className="w-[52.75rem] overflow-hidden rounded-xl bg-white shadow-lg ring-1 shadow-gray-900/5 ring-gray-500/10">
                    <Image
                      src={feature.image}
                      className="w-full"
                      style={{
                        width: '52.75rem',
                        height: '52.75rem',
                      }}
                      alt=""
                    />
                  </div>
                </TabPanel>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-4xl ring-1 ring-gray-900/10 ring-inset" />
          </TabPanels>
        </>
      )}
    </TabGroup>
  )
}

export const HomePageSecondaryFeatures = () => {
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
        <FeaturesMobile />
        <FeaturesDesktop />
      </div>
    </section>
  )
}
