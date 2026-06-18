import { Link } from '@/components/shared/links/Link'
import { buttonStylesSecondary } from '@/components/shared/links/styles'
import { homeCtaPrimary } from './styles'

export const HomePageHero = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-12 text-center sm:px-6 lg:px-8 lg:pt-24">
      <h1 className="font-display mx-auto max-w-4xl text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl sm:font-medium md:text-6xl">
        Verkehrsplanung neu gedacht: Ihre Daten, Ihr Team, eine Plattform
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-gray-700">
        Sie erhalten offene, speziell für die Verkehrsplanung aufbereitete Daten in einer modernen
        Cloudanwendung. Aktualisieren Sie Ihre Daten fortlaufend – ganz ohne Befahrungen – und
        nutzen Sie sie kollaborativ.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="https://www.fixmycity.de/termin-vereinbaren"
          button
          className={homeCtaPrimary}
          blank
        >
          Jetzt kostenlose Demo anfragen
        </Link>
        <Link to="/regionen" classNameOverwrite={buttonStylesSecondary}>
          Regionen ansehen
        </Link>
      </div>
    </section>
  )
}
