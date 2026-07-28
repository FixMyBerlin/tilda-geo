import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { Link } from '@/components/shared/links/Link'
import { DemoButton } from './DemoButton'

export const HomePageHero = () => {
  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 pt-12 pb-16 text-center sm:px-6 sm:pt-16 lg:px-8 lg:pt-28 lg:pb-20">
        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-balance text-gray-900 sm:text-5xl lg:text-6xl lg:tracking-[-0.02em]">
          Verkehrsplanung modernisiert: Ihre Daten, Ihr Team, eine Plattform
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
          TILDA unterstützt Kommunen dabei, ihre Verkehrsinfrastruktur digital abzubilden und
          aktuell zu halten. Die Plattform vereint Daten, Karten und Teamarbeit an einem Ort, ohne
          eigene komplexe GIS-Infrastruktur. So werden Planungen transparenter, effizienter und
          nachvollziehbarer.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center">
          <DemoButton variant="brand" />
          <Link
            href="https://fixmycity.de/referenzen"
            classNameOverwrite="inline-flex items-center justify-center gap-2 rounded-lg border-[1.5px] border-gray-700/60 bg-transparent px-6 py-3 text-base font-medium text-gray-800 no-underline transition-colors select-none hover:border-gray-700 hover:bg-gray-700/5 focus-visible:ring-2 focus-visible:ring-gray-700/30 focus-visible:outline-none active:bg-gray-700/10"
            blank
          >
            Referenzen ansehen
            <ArrowTopRightOnSquareIcon className="size-5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
