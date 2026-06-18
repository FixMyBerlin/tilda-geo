import {
  DisclosureButton,
  DisclosurePanel,
  Disclosure as HeadlessUiDisclosure,
} from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { twJoin } from 'tailwind-merge'

type Faq = {
  question: string
  answer: string
}

const faqs: Faq[] = [
  {
    question: 'Wie kann das Radnetz für meine Kommune erfasst werden?',
    answer:
      'Die Erfassung kann auf verschiedenen Wegen erfolgen: durch die Nutzung und Aufbereitung bestehender Daten, durch professionelle 360°-Befahrungen oder durch die Ergänzung und Qualitätssicherung von OpenStreetMap-Daten. Gemeinsam wählen wir den für Ihre Kommune passenden Ansatz und schaffen eine belastbare Datengrundlage für die weitere Planung.',
  },
  {
    question: 'Was kostet TILDA?',
    answer:
      'Die Kosten hängen vom Projektumfang, der Größe des Gebiets, dem gewünschten Funktionsumfang sowie möglichen Zusatzleistungen wie Befahrungen, Datenaufbereitung oder Planungsunterstützung ab. Gerne erstellen wir Ihnen ein individuelles Angebot, das auf Ihre Anforderungen zugeschnitten ist.',
  },
  {
    question: 'Brauche ich eigene Befahrungen, um die Daten aktuell zu halten?',
    answer:
      'Nein. TILDA basiert auf OpenStreetMap und bleibt dadurch fortlaufend tagesaktuell. Sie tragen nur Änderungen ein – teure Wiederholungsbefahrungen entfallen.',
  },
  {
    question: 'Wie schnell kann TILDA in unserer Kommune eingesetzt werden?',
    answer:
      'TILDA ist eine cloudbasierte Anwendung und kann in der Regel innerhalb weniger Tage bereitgestellt werden. Der genaue Zeitrahmen hängt davon ab, ob bereits geeignete Daten vorliegen oder zunächst eine Datenerfassung beziehungsweise Datenaufbereitung erfolgen muss. Gemeinsam entwickeln wir einen Einführungsplan, der zu Ihren Anforderungen passt. Gerne weisen wir Sie auch persönlich in die Nutzung von TILDA ein.',
  },
  {
    question: 'Wie kann ich ein Angebot erhalten?',
    answer:
      'Nehmen Sie Kontakt mit dem TILDA-Team auf und schildern Sie Ihr Vorhaben. Auf Basis Ihrer Anforderungen, der Größe des Untersuchungsgebiets und der gewünschten Leistungen erstellen wir ein individuelles Angebot für Ihre Kommune.',
  },
    {
    question: 'Können wir unsere bestehenden Daten in TILDA integrieren?',
    answer:
      'Ja. TILDA ist als zentraler Daten-Hub konzipiert und ermöglicht die Einbindung vorhandener kommunaler Datenbestände. Bestehende Geodaten können übernommen, mit den TILDA-Daten verknüpft und für Analysen, Auswertungen und die weitere Planung genutzt werden. Gleichzeitig bleiben die Daten in offenen Formaten exportierbar und können weiterhin in bestehenden Fachverfahren verwendet werden.',
  },
]

export const HomePageFaq = () => {
  return (
    <section className="bg-[#f6f3f2]">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-[#1b1c1c] sm:text-4xl">
          Häufige Fragen von Kommunen
        </h2>
        <p className="mt-4 text-center text-base text-[#514532] sm:text-lg">
          Alles, was Sie über TILDA wissen müssen
        </p>

        <dl className="mt-10 flex flex-col gap-4">
          {faqs.map((faq, index) => (
            <HeadlessUiDisclosure
              as="div"
              key={faq.question}
              defaultOpen={index === 0}
              className="overflow-hidden rounded-2xl bg-white"
            >
              {({ open }) => (
                <>
                  <dt>
                    <DisclosureButton className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left hover:bg-black/[0.02] focus:outline-none focus-visible:ring focus-visible:ring-yellow-500">
                      <span className="text-base font-semibold text-[#1b1c1c] sm:text-lg">
                        {faq.question}
                      </span>
                      <ChevronDownIcon
                        className={twJoin(
                          'size-6 flex-none text-[#514532] transition-transform',
                          open && 'rotate-180',
                        )}
                      />
                    </DisclosureButton>
                  </dt>
                  <DisclosurePanel
                    as="dd"
                    className="px-6 pb-5 text-sm leading-relaxed text-[#514532]"
                  >
                    {faq.answer}
                  </DisclosurePanel>
                </>
              )}
            </HeadlessUiDisclosure>
          ))}
        </dl>
      </div>
    </section>
  )
}
