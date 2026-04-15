import { Link } from '@/components/shared/links/Link'

const products = [
  {
    name: 'TILDA Radverkehr',
    tagline: 'Aktuelle Radinfrastrukturdaten für Ihre Radverkehrsplanung',
    description:
      'Standardisierte Daten zu Führungsformen, Breiten, Belägen, Verkehrszeichen und Markierungen – tagesaktuell aus OpenStreetMap, ohne eigene Befahrung.',
    benefits: [
      'Radnetz erfassen und tagesaktuell halten',
      'Infrastrukturattribute: Breiten, Beläge, Führungsformen',
      'Interkommunale Zusammenarbeit (z. B. NUDAFA)',
      'Export in gängige GIS-Formate',
    ],
    href: 'https://www.fixmycity.de/tilda-radverkehr/',
    cta: 'Mehr zu TILDA Radverkehr →',
    accent: 'bg-yellow-50 border-yellow-200',
    ctaClass: 'bg-yellow-400 hover:bg-yellow-500',
  },
  {
    name: 'TILDA Parkraum',
    tagline: 'Parkraumdaten systematisch erfassen, pflegen und auswerten',
    description:
      'Erstbefahrung mit 360°-Kamera günstiger als marktüblich. Danach nur noch Änderungen einpflegen – Ihre Daten bleiben dauerhaft aktuell.',
    benefits: [
      'Ersterfassung inkl. Befahrung günstiger als Marktdurchschnitt',
      'Automatische Neuberechnung bei Regeländerungen',
      'Hohe Attributtiefe für vielfältige Auswertungen',
      '360°-Straßenbilder integriert',
    ],
    href: 'https://www.fixmycity.de/tilda-parkraum/',
    cta: 'Mehr zu TILDA Parkraum →',
    accent: 'bg-gray-50 border-gray-200',
    ctaClass: 'bg-gray-800 text-white hover:bg-gray-700',
  },
]

export const HomePageProducts = () => {
  return (
    <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Die TILDA Geodatenprodukte
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          Zwei spezialisierte Lösungen für die kommunale Verkehrsplanung – sofort einsetzbar,
          günstig im Betrieb.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        {products.map((product) => (
          <div key={product.name} className={`rounded-2xl border p-8 ${product.accent}`}>
            <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
            <p className="mt-1 text-sm font-medium text-gray-600">{product.tagline}</p>
            <p className="mt-4 text-gray-700">{product.description}</p>
            <ul className="mt-6 space-y-2">
              {product.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-0.5 text-yellow-500">✓</span>
                  {benefit}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link
                href={product.href as `https://${string}`}
                className={`inline-flex items-center no-underline ${product.ctaClass}`}
                button
                blank
              >
                {product.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
