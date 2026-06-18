// Platzhalter-Regionsnamen aus dem Mockup. Können später aus echten Regionsdaten
// gespeist werden.
const regionNames = [
  'Stadt Berlin',
  'Land Brandenburg',
  'Landkreis Bielefeld',
  'Landkreis Woldegk',
  'Stadt Bietigheim-Bissingen',
  'Stadt Überlingen',
  'Gemeinde Eichwalde',
  'Stadt Wildau',
  'Stadt Königs Wusterhausen',
  'Gemeinde Zeuthen',
  'Gemeinde Schulzendorf',
  'Amt Treptower Tollensewinkel',
  'Amt Woldegk',
]

export const HomePageTrustBar = () => {
  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-base text-[#514532] sm:text-lg">
          Bereits über{' '}
          <span className="font-semibold text-[#7e5700]">
            15+ Kommunen, Landkreise und Bundesländer
          </span>{' '}
          nutzen bereits TILDA
        </p>
      </div>

      {/* Endlos-Laufband: zwei identische Listen, animiert um -50 % → nahtlos.
          Das Duplikat ist für Screenreader ausgeblendet. */}
      <div className="relative mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex w-max animate-[home-marquee_60s_linear_infinite] hover:[animation-play-state:paused] motion-reduce:animate-none">
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              aria-hidden={copy === 1}
              className="flex shrink-0 items-center gap-x-10 pr-10 sm:gap-x-14 sm:pr-14"
            >
              {regionNames.map((name) => (
                <li
                  key={name}
                  className="text-xl font-semibold whitespace-nowrap text-[#fcb900] sm:text-2xl"
                >
                  {name}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  )
}
