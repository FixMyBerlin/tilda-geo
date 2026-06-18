import { Link } from '@/components/shared/links/Link'

export const HomePageCtaBanner = () => {
  return (
    <section className="bg-[#fabe48]">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
        <h2 className="text-3xl font-semibold tracking-tight text-[#1c1b1f] sm:text-4xl">
          Bereit für die digitale Verkehrsplanung?
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base text-[#1c1b1f]/90 sm:text-lg">
          Lassen Sie uns gemeinsam schauen, wie TILDA Ihren Arbeitsalltag in der Verwaltung
          erleichtert.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="https://fixmycity.de/termin-vereinbaren"
            classNameOverwrite="inline-flex items-center justify-center rounded-lg bg-[#fafafa] px-7 py-4 text-base font-medium text-[#514532] no-underline shadow-lg transition-colors select-none hover:bg-white focus-visible:ring-2 focus-visible:ring-[#514532]/30 focus-visible:outline-none active:bg-[#f0ece9]"
            blank
          >
            Jetzt kostenlose Demo anfragen
          </Link>
        </div>
      </div>
    </section>
  )
}
