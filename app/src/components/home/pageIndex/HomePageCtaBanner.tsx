import { Link } from '@/components/shared/links/Link'

export const HomePageCtaBanner = () => {
  return (
    <section className="w-full bg-yellow-400">
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
        <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Bereit für die digitale Verkehrsplanung?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg tracking-tight text-gray-800">
          Lassen Sie uns gemeinsam schauen, wie TILDA Ihren Arbeitsalltag in der Verwaltung
          erleichtert.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="https://www.fixmycity.de/termin-vereinbaren"
            button
            className="bg-white shadow hover:bg-gray-100"
            blank
          >
            Jetzt kostenlose Demo anfragen
          </Link>
        </div>
      </div>
    </section>
  )
}
