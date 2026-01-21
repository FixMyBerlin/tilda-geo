'use client'
import { useBreakpoint } from '@/src/app/regionen/[regionSlug]/_components/utils/useBreakpoint'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import Image, { StaticImageData } from 'next/image'
import { twJoin } from 'tailwind-merge'
import screenshotBikelanes from './assets/HomePagePrimaryFeatures/bikelanes.jpg'
import screenshotOther from './assets/HomePagePrimaryFeatures/other.jpg'
import screenshotPoiClassification from './assets/HomePagePrimaryFeatures/poiclassification.jpg'
import screenshotSurface from './assets/HomePagePrimaryFeatures/surface.jpg'
import backgroundImage from './assets/background-features.jpg'

type Feature = {
  title: string | React.ReactNode
  description: string
  image: StaticImageData
}

const features: Feature[] = [
  {
    title: (
      <>
        <span className="hidden xl:inline">Themenkarte</span> Radinfrastruktur
      </>
    ),
    description: 'Breite, Führungsform und Oberflächen.',
    image: screenshotBikelanes,
  },
  {
    title: (
      <>
        <span className="hidden xl:inline">Themenkarte</span> Quellen und Ziele
      </>
    ),
    description: 'Schulen, Wohn- oder Gewerbegebieten, Einkaufs- und Freizeitmöglichkeiten.',
    image: screenshotPoiClassification,
  },
  {
    title: (
      <>
        <span className="hidden xl:inline">Themenkarte</span> Oberflächenqualität
      </>
    ),
    description: 'Oberflächenqualität und Oberflächenart von Radwegen und Fahrbahnen.',
    image: screenshotSurface,
  },
  {
    title: (
      <>
        <span className="hidden xl:inline">Weitere Themenkarten</span>
        <span className="inline xl:hidden">Mehr</span>
      </>
    ),
    description:
      'Karten zu Straßentypen, Höchstgeschwindigkeiten, Parkraum werden nach und nach hinzugefügt.',
    image: screenshotOther,
  },
]

export const HomePagePrimaryFeatures = () => {
  const isLgOrAbove = useBreakpoint('lg')
  const tabOrientation = isLgOrAbove ? 'vertical' : 'horizontal'

  return (
    <section
      id="features"
      aria-label="Features for running your books"
      className="relative overflow-hidden bg-blue-600 pt-20 pb-28 sm:py-32"
    >
      <Image
        src={backgroundImage}
        className="absolute top-1/2 left-1/2 max-w-none translate-x-[-44%] translate-y-[-42%]"
        alt=""
        width={2245}
        height={1636}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl md:mx-auto md:text-center xl:max-w-none">
          <h2 className="font-display text-3xl tracking-tight text-white sm:text-4xl md:text-5xl">
            Der Radverkehrsatlas liefert wertvolle Daten
          </h2>
          <p className="mt-6 text-lg tracking-tight text-blue-100">
            Der Radverkehrsatlas bietet für die Radverkehrsplanung relevante Themenkarten. <br />
            Sie können die Datensätze aus dem Radverkehrsatlas jederzeit herunterladen.
          </p>
        </div>
        <TabGroup
          as="div"
          className="mt-16 grid grid-cols-1 items-center gap-y-2 pt-10 sm:gap-y-6 md:mt-20 lg:grid-cols-12 lg:pt-0"
          vertical={tabOrientation === 'vertical'}
        >
          {({ selectedIndex }) => (
            <>
              <div className="-mx-4 flex overflow-x-auto pb-4 sm:mx-0 sm:overflow-visible sm:pb-0 lg:col-span-5">
                <TabList className="relative z-10 flex gap-x-4 px-4 whitespace-nowrap sm:mx-auto sm:px-0 lg:mx-0 lg:block lg:gap-x-0 lg:gap-y-1 lg:whitespace-normal">
                  {features.map((feature, featureIndex) => (
                    <div
                      key={featureIndex}
                      className={twJoin(
                        'group relative rounded-full px-4 py-1 lg:rounded-l-xl lg:rounded-r-none lg:p-6',
                        selectedIndex === featureIndex
                          ? 'bg-white lg:bg-white/10 lg:ring-1 lg:ring-white/10 lg:ring-inset'
                          : 'hover:bg-white/10 lg:hover:bg-white/5',
                      )}
                    >
                      <h3>
                        <Tab
                          className={twJoin(
                            'font-display text-lg [&:not(:focus-visible)]:focus:outline-none',
                            selectedIndex === featureIndex
                              ? 'text-blue-600 lg:text-white'
                              : 'text-blue-100 hover:text-white lg:text-white',
                          )}
                        >
                          <span className="absolute inset-0 rounded-full lg:rounded-l-xl lg:rounded-r-none" />
                          {feature.title}
                        </Tab>
                      </h3>
                      <p
                        className={twJoin(
                          'mt-2 hidden text-sm lg:block',
                          selectedIndex === featureIndex
                            ? 'text-white'
                            : 'text-blue-100 group-hover:text-white',
                        )}
                      >
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </TabList>
              </div>
              <TabPanels className="lg:col-span-7">
                {features.map((feature, featureIndex) => (
                  <TabPanel key={featureIndex} unmount={false}>
                    <div className="relative sm:px-6 lg:hidden">
                      <div className="absolute -inset-x-4 top-[-6.5rem] bottom-[-4.25rem] bg-white/10 ring-1 ring-white/10 ring-inset sm:inset-x-0 sm:rounded-t-xl" />
                      <p className="relative mx-auto max-w-2xl text-base text-white sm:text-center">
                        {feature.description}
                      </p>
                    </div>
                    <div className="mt-6 w-[45rem] overflow-hidden rounded-xl bg-gray-50 shadow-xl shadow-blue-900/20 sm:w-auto lg:mt-0 lg:w-[67.8125rem]">
                      <Image className="w-full" src={feature.image} alt="" />
                    </div>
                  </TabPanel>
                ))}
              </TabPanels>
            </>
          )}
        </TabGroup>
      </div>
    </section>
  )
}
