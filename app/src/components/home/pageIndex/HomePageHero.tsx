import { Link } from '@/components/shared/links/Link'

export const HomePageHero = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 text-center sm:px-6 lg:px-8 lg:pt-32">
      <p className="text-center">Die TILDA Geodatenprodukte</p>
      <h1 className="font-display mx-auto max-w-4xl text-2xl font-bold tracking-tight text-gray-900 sm:text-5xl sm:font-medium md:text-6xl">
        TILDA bringt Ihnen Geodaten für die <span className="text-yellow-500">Verkehrsplanung</span>{' '}
        – nachhaltig und für die Nutzung im Team.
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-gray-700">
        TILDA bringt Ihnen perfekt auf die Anforderungen der Verkehrsplanung zugeschnittene offene
        Daten in einer modernen Cloudanwendung. Aktualisieren Sie Daten fortlaufend ohne Befahrungen
        und nutzen Sie die Daten kollaborativ.
      </p>
      <div className="text-md mx-auto mt-6 flex max-w-2xl justify-center tracking-tight text-gray-700 sm:text-lg">
        <Link
          href="https://www.fixmycity.de/tilda"
          className="inline-flex items-center bg-yellow-400 no-underline hover:bg-yellow-500"
          button
          blank
        >
          Mehr erfahren…
        </Link>
      </div>
    </section>
  )
}
