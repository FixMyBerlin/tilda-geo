const faqs = [
  {
    question: 'Wie kann meine Kommune das Radnetz erfassen?',
    answer:
      'Mit TILDA Radverkehr erhalten Sie sofort einsatzbereite Radinfrastrukturdaten aus OpenStreetMap – ohne eigene Befahrung. Die Daten sind tagesaktuell und können von Ihrem Team direkt in der Browser-Anwendung gepflegt und ergänzt werden. Eine Ersteinrichtung dauert in der Regel nur wenige Tage.',
  },
  {
    question: 'Was kostet TILDA für eine kleine Stadt oder Gemeinde?',
    answer:
      'Das Basis-Paket für kleinere Kommunen startet ab 4.600 € pro Jahr und beinhaltet 5 Nutzer-Accounts. Das Standard-Paket für mittelgroße Städte kostet 16.400 € / Jahr. Für Landkreise und Bundesländer gibt es ein Premium-Paket ab 44.000 € / Jahr. Alle Preise beinhalten die gesamte Geodateninfrastruktur – kein versteckter Mehraufwand.',
  },
  {
    question: 'Brauche ich eigene Befahrungen, um die Daten aktuell zu halten?',
    answer:
      'Nein. TILDA Radverkehr nutzt OpenStreetMap als Datenbasis – die weltweit größte offene Geodatenbank, die täglich aktualisiert wird. Bei TILDA Parkraum erfolgt eine einmalige Erstbefahrung mit 360°-Kamera. Danach werden nur noch Änderungen eingetragen, was teure Wiederholungsbefahrungen überflüssig macht.',
  },
  {
    question: 'Kann TILDA interkommunal genutzt werden?',
    answer:
      'Ja. TILDA ist explizit für die interkommunale Zusammenarbeit ausgelegt. Mehrere Kommunen können gemeinsam auf denselben Datensatz zugreifen, Daten pflegen und auswerten – wie etwa im Projekt NUDAFA für die interkommunale Radnetzplanung im Landkreis Dahme-Spreewald.',
  },
  {
    question: 'Wie integriere ich TILDA-Daten in mein bestehendes GIS?',
    answer:
      'TILDA unterstützt den Export in gängige GIS-Formate und lässt sich über standardisierte Schnittstellen in Ihre bestehende Geodateninfrastruktur einbinden. Das Team von FixMyCity berät Sie gerne zu den technischen Integrationsmöglichkeiten.',
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

export const HomePageFAQ = () => {
  return (
    <section className="mx-auto mt-24 max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <h2 className="font-display text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        Häufige Fragen von Kommunen
      </h2>
      <div className="mt-12 space-y-6">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="group rounded-xl border border-gray-200 bg-white p-6 open:shadow-sm"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-gray-900 marker:content-none">
              {faq.question}
              <span className="shrink-0 text-yellow-500 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-4 text-gray-700">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
