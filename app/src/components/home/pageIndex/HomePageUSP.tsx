const usps = [
  {
    icon: '💶',
    title: 'Günstig',
    description:
      'Bereits ab 4.600 € / Jahr – deutlich unter dem Marktdurchschnitt für vergleichbare Geodatenleistungen.',
  },
  {
    icon: '🚀',
    title: 'Sofort startklar',
    description:
      'Keine IT-Kenntnisse erforderlich. Daten sind von Tag 1 an in der Cloud verfügbar und nutzbar.',
  },
  {
    icon: '🔄',
    title: 'Ohne Neubefahrungen',
    description:
      'OSM-basierte Daten bleiben tagesaktuell. Nur Änderungen werden eingetragen – keine teuren Wiederholungsbefahrungen.',
  },
  {
    icon: '🔓',
    title: 'Open Source',
    description:
      'Kein Vendor-Lock-in. Die gesamte Software ist quelloffen – Ihre Daten gehören Ihnen.',
  },
]

export const HomePageUSP = () => {
  return (
    <section className="mt-24 w-full bg-yellow-50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="font-display text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Warum Kommunen TILDA wählen
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {usps.map((usp) => (
            <div key={usp.title} className="rounded-xl bg-white p-6 shadow-sm">
              <div className="text-3xl">{usp.icon}</div>
              <h3 className="mt-3 text-lg font-semibold text-gray-900">{usp.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{usp.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
