// Placeholder region names from the mockup. Can later be sourced from real region data.
const regionNames = [
  'Stadt Berlin',
  'Land Brandenburg',
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
        <p id="home-trust-bar-stats" className="text-center text-base text-gray-700 sm:text-lg">
          Bereits mehr als{' '}
          <span className="font-semibold text-yellow-800">
            15 Kommunen, Landkreise und Bundesländer
          </span>{' '}
          nutzen TILDA
        </p>
      </div>

      {/* Infinite marquee: two identical lists, animated by -50% for a seamless loop.
          The duplicate is hidden from screen readers. */}
      <div className="relative mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex w-max animate-[home-marquee_60s_linear_infinite] hover:[animation-play-state:paused] motion-reduce:animate-none">
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              aria-hidden={copy === 1 ? true : undefined}
              aria-labelledby={copy === 0 ? 'home-trust-bar-stats' : undefined}
              className="flex shrink-0 items-center gap-x-10 pr-10 sm:gap-x-14 sm:pr-14"
            >
              {regionNames.map((name) => (
                <li
                  key={name}
                  className="text-xl font-semibold whitespace-nowrap text-yellow-500 sm:text-2xl"
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
