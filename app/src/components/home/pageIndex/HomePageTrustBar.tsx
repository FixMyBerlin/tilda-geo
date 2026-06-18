// Platzhalter-Regionsnamen aus dem Mockup. Können später aus echten Regionsdaten
// gespeist werden.
const regionNames = [
  'Stadt Berlin',
  'Bundesland Brandenburg',
  'Landkreis Bielefeld',
  'Landkreis Woldegk',
  'Stadt Bietigheim-Bissingen',
  'Stadt Überlingen',
]

export const HomePageTrustBar = () => {
  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
      <p className="text-center text-sm tracking-tight text-gray-600 sm:text-base">
        Bereits über{' '}
        <span className="font-semibold text-gray-900">50+ Kommunen und Landkreise</span> planen ihre
        Radwege und Straßen mit TILDA
      </p>
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        {regionNames.map((name) => (
          <li key={name} className="text-base font-semibold text-yellow-600">
            {name}
          </li>
        ))}
      </ul>
    </section>
  )
}
