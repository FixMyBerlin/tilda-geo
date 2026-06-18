import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { Link } from '@/components/shared/links/Link'

export const HomePageHero = () => {
  return (
    <section className="bg-[#fcf9f8]">
      <div className="mx-auto max-w-4xl px-4 pt-12 pb-16 text-center sm:px-6 sm:pt-16 lg:px-8 lg:pt-28 lg:pb-20">
        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-balance text-[#1b1c1c] sm:text-5xl lg:text-6xl lg:tracking-[-0.02em]">
          Verkehrsplanung modernisiert: Ihre Daten, Ihr Team, eine Plattform
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-[#5a5a5a] sm:text-lg">
          TILDA unterstützt Kommunen dabei, ihre Verkehrsinfrastruktur digital abzubilden und
          aktuell zu halten. Die Plattform vereint Daten, Karten und Teamarbeit an einem Ort, ohne
          komplexe GIS-Systeme. So werden Planungen transparenter, effizienter und
          nachvollziehbarer.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center">
          <Link
            href="https://fixmycity.de/termin-vereinbaren"
            classNameOverwrite="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ffb400] px-6 py-3 text-base font-medium text-[#1b1c1c] no-underline shadow-lg transition-colors select-none hover:bg-[#f3ab00] focus-visible:ring-2 focus-visible:ring-[#7e5700]/40 focus-visible:outline-none active:bg-[#e0a800]"
            blank
          >
            Jetzt kostenlose Demo anfragen
            <ArrowRightIcon className="size-5" aria-hidden />
          </Link>
          <Link
            href="https://fixmycity.de/referenzen"
            classNameOverwrite="inline-flex items-center justify-center gap-2 rounded-lg border-[1.5px] border-[#514532]/60 bg-transparent px-6 py-3 text-base font-medium text-[#2c2c2c] no-underline transition-colors select-none hover:border-[#514532] hover:bg-[#514532]/5 focus-visible:ring-2 focus-visible:ring-[#514532]/30 focus-visible:outline-none active:bg-[#514532]/10"
            blank
          >
            Referenzen ansehen
          </Link>
        </div>
      </div>
    </section>
  )
}
