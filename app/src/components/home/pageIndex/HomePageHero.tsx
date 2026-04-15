import { Link } from '@/components/shared/links/Link'

export const HomePageHero = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 text-center sm:px-6 lg:px-8 lg:pt-32">
      <p className="text-center text-sm font-semibold tracking-widest text-yellow-600 uppercase">
        Geodatenprodukte für Kommunen und Landkreise
      </p>
      <h1 className="font-display mx-auto mt-4 max-w-4xl text-2xl font-bold tracking-tight text-gray-900 sm:text-5xl sm:font-medium md:text-6xl">
        Radnetz erfassen und Parkraumdaten erhalten –{' '}
        <span className="text-yellow-500">schnell, günstig und ohne Befahrungen</span>
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-gray-700">
        TILDA liefert Ihrer Verwaltung aktuelle, standardisierte Radverkehrs- und Parkraumdaten als
        moderne Cloud-Anwendung. OSM-basiert, Open Source und sofort einsatzbereit – für Kommunen ab
        4.600 € / Jahr.
      </p>
      <div className="mx-auto mt-8 flex max-w-2xl flex-col justify-center gap-4 sm:flex-row">
        <Link
          href="https://www.fixmycity.de/tilda-radverkehr/"
          className="inline-flex items-center bg-yellow-400 no-underline hover:bg-yellow-500"
          button
          blank
        >
          TILDA Radverkehr entdecken →
        </Link>
        <Link
          href="https://www.fixmycity.de/tilda-parkraum/"
          className="inline-flex items-center border border-yellow-400 bg-white no-underline hover:bg-yellow-50"
          button
          blank
        >
          TILDA Parkraum entdecken →
        </Link>
      </div>
    </section>
  )
}
