import Image from 'next/image'
import backgroundImage from './images/background-faqs.jpg'

type FAQ = {
  question: string
  answer: string
}
const faqs: FAQ[][] = [
  [
    {
      question: 'TODO Does TaxPal handle VAT?',
      answer: 'Well no, but if you move your company offshore you can probably ignore it.',
    },
    {
      question: 'TODO Can I pay for my subscription via purchase order?',
      answer: 'Absolutely, we are happy to take your money in all forms.',
    },
    {
      question: 'TODO How do I apply for a job at TaxPal?',
      answer:
        'We only hire our customers, so subscribe for a minimum of 6 months and then let’s talk.',
    },
  ],
  [
    {
      question: 'TODO What was that testimonial about tax fraud all about?',
      answer:
        'TaxPal is just a software application, ultimately your books are your responsibility.',
    },
    {
      question: 'TaxPal sounds horrible but why do I still feel compelled to purchase?',
      answer:
        'This is the power of excellent visual design. You just can’t resist it, no matter how poorly it actually functions.',
    },
    {
      question: 'I found other companies called TaxPal, are you sure you can use this name?',
      answer:
        'Honestly not sure at all. We haven’t actually incorporated or anything, we just thought it sounded cool and made this website.',
    },
  ],
  [
    {
      question: 'TODO How do you generate reports?',
      answer:
        'You just tell us what data you need a report for, and we get our kids to create beautiful charts for you using only the finest crayons.',
    },
    {
      question: 'TODO Can we expect more inventory features?',
      answer: 'In life it’s really better to never expect anything at all.',
    },
    {
      question: 'TODO I lost my password, how do I get into my account?',
      answer:
        'Send us an email and we will send you a copy of our latest password spreadsheet so you can find your information.',
    },
  ],
]

export const Faqs = () => {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="relative overflow-hidden bg-gray-50 py-20 sm:py-32"
    >
      <Image
        src={backgroundImage}
        className="absolute top-0 left-1/2 max-w-none translate-x-[-30%] -translate-y-1/4"
        alt=""
        width={1558}
        height={946}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2
            id="faq-title"
            className="font-display text-3xl tracking-tight text-gray-900 sm:text-4xl"
          >
            Fragen & Antworten
          </h2>
          <p className="mt-4 text-lg tracking-tight text-gray-700">
            TODO If you can’t find what you’re looking for, email our support team and if you’re
            lucky someone will get back to you.
          </p>
        </div>
        <ul className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
          {faqs.map((column, columnIndex) => (
            <li key={columnIndex}>
              <ul className="flex flex-col gap-y-8">
                {column.map((faq, faqIndex) => (
                  <li key={faqIndex}>
                    <h3 className="font-display text-lg leading-7 text-gray-900">{faq.question}</h3>
                    <p className="mt-4 text-sm text-gray-700">{faq.answer}</p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
