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

// Antwort 1 stammt aus dem Mockup. Antworten 2–5 sind Platzhalter und sollten
// inhaltlich noch finalisiert werden.
const faqs: Faq[] = [
  {
    question: 'Wie kann meine Kommune das Radnetz erfassen?',
    answer:
      'Mit TILDA Radverkehr erhalten Sie sofort einsatzbereite Radinfrastrukturdaten aus OpenStreetMap – ohne eigene Befahrung. Die Daten sind tagesaktuell und können von Ihrem Team direkt in der Browser-Anwendung gepflegt und ergänzt werden. Eine Ersteinrichtung dauert in der Regel nur wenige Tage.',
  },
  {
    question: 'Was kostet TILDA für eine kleine Stadt oder Gemeinde?',
    answer:
      'TILDA wird als günstige Cloud-Anwendung im Abo angeboten – die Kosten richten sich nach Größe und Umfang Ihrer Kommune. Sprechen Sie uns für ein individuelles Angebot an.',
  },
  {
    question: 'Brauche ich eigene Befahrungen, um die Daten aktuell zu halten?',
    answer:
      'Nein. TILDA basiert auf OpenStreetMap und bleibt dadurch fortlaufend tagesaktuell. Sie tragen nur Änderungen ein – teure Wiederholungsbefahrungen entfallen.',
  },
  {
    question: 'Kann TILDA interkommunal genutzt werden?',
    answer:
      'Ja. Mehrere Kommunen und Landkreise können gemeinsam an einem Netz arbeiten – ideal für interkommunale Radnetzplanung wie im Projekt NUDAFA.',
  },
  {
    question: 'Wie integriere ich TILDA-Daten in mein bestehendes GIS?',
    answer:
      'TILDA-Daten stehen in offenen, standardisierten Formaten zur Verfügung und lassen sich in Ihre bestehenden GIS-Systeme exportieren und einbinden.',
  },
]

export const HomePageFaq = () => {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <h2 className="font-display text-center text-3xl tracking-tight text-gray-900 sm:text-4xl">
        Häufige Fragen von Kommunen
      </h2>
      <p className="mt-4 text-center text-lg tracking-tight text-gray-700">
        Alles, was Sie über TILDA wissen müssen
      </p>

      <dl className="mt-10 divide-y divide-gray-200 rounded-2xl bg-white ring-1 ring-gray-900/5">
        {faqs.map((faq, index) => (
          <HeadlessUiDisclosure as="div" key={faq.question} defaultOpen={index === 0}>
            {({ open }) => (
              <>
                <dt>
                  <DisclosureButton className="flex w-full items-center justify-between px-6 py-5 text-left hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-gray-500">
                    <span className="text-base font-medium text-gray-900">{faq.question}</span>
                    <ChevronDownIcon
                      className={twJoin(
                        'ml-4 size-5 flex-none text-gray-500 transition-transform',
                        open ? 'rotate-180' : '',
                      )}
                    />
                  </DisclosureButton>
                </dt>
                <DisclosurePanel as="dd" className="px-6 pb-5 text-sm tracking-tight text-gray-600">
                  {faq.answer}
                </DisclosurePanel>
              </>
            )}
          </HeadlessUiDisclosure>
        ))}
      </dl>
    </section>
  )
}
