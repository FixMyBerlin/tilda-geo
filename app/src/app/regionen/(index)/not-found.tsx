import { Link } from '@/src/app/_components/links/Link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  robots: 'noindex',
  title: 'Region nicht gefunden (Fehler 404)',
}

export default function Page404() {
  return (
    <div className="flex min-h-full flex-col bg-white pt-16 pb-12">
      <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="py-16">
          <div className="text-center">
            <p className="text-base font-semibold text-yellow-500">404</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Region nicht gefunden
            </h1>
            <p className="mt-2 text-base text-gray-500">
              Leider konnten wir diese Region nicht finden.
            </p>
            <div className="mt-6">
              <Link href="/regionen">
                Zur öffentlichen Regionsliste
                <span aria-hidden="true"> &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
