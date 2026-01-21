import Image, { StaticImageData } from 'next/image'
import avatarImage1 from './images/HomePageTestimonials/avatar-1.png'
import avatarImage3 from './images/HomePageTestimonials/avatar-3.png'
import avatarChristoph from './images/HomePageTestimonials/christoph.jpg'

type Testimonial = {
  content: string
  author: {
    name: string
    role: string
    image: StaticImageData
  }
}

const testimonials: Testimonial[][] = [
  [
    {
      content:
        'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. ',
      author: {
        name: 'Tobias Schunn',
        role: 'Role at Company',
        image: avatarImage1,
      },
    },
  ],
  [
    {
      content:
        'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. ',
      author: {
        name: 'Christoph Kollert',
        role: 'Christoph Kollert, Projektleitung Nudafa',
        image: avatarChristoph,
      },
    },
  ],
  [
    {
      content:
        'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. ',
      author: {
        name: 'Anne Harnack',
        role: 'Role at Company',
        image: avatarImage3,
      },
    },
  ],
]

const QuoteIcon = (props: any) => {
  return (
    <svg aria-hidden="true" width={105} height={78} {...props}>
      <path d="M25.086 77.292c-4.821 0-9.115-1.205-12.882-3.616-3.767-2.561-6.78-6.102-9.04-10.622C1.054 58.534 0 53.411 0 47.686c0-5.273.904-10.396 2.712-15.368 1.959-4.972 4.746-9.567 8.362-13.786a59.042 59.042 0 0 1 12.43-11.3C28.325 3.917 33.599 1.507 39.324 0l11.074 13.786c-6.479 2.561-11.677 5.951-15.594 10.17-3.767 4.219-5.65 7.835-5.65 10.848 0 1.356.377 2.863 1.13 4.52.904 1.507 2.637 3.089 5.198 4.746 3.767 2.41 6.328 4.972 7.684 7.684 1.507 2.561 2.26 5.5 2.26 8.814 0 5.123-1.959 9.19-5.876 12.204-3.767 3.013-8.588 4.52-14.464 4.52Zm54.24 0c-4.821 0-9.115-1.205-12.882-3.616-3.767-2.561-6.78-6.102-9.04-10.622-2.11-4.52-3.164-9.643-3.164-15.368 0-5.273.904-10.396 2.712-15.368 1.959-4.972 4.746-9.567 8.362-13.786a59.042 59.042 0 0 1 12.43-11.3C82.565 3.917 87.839 1.507 93.564 0l11.074 13.786c-6.479 2.561-11.677 5.951-15.594 10.17-3.767 4.219-5.65 7.835-5.65 10.848 0 1.356.377 2.863 1.13 4.52.904 1.507 2.637 3.089 5.198 4.746 3.767 2.41 6.328 4.972 7.684 7.684 1.507 2.561 2.26 5.5 2.26 8.814 0 5.123-1.959 9.19-5.876 12.204-3.767 3.013-8.588 4.52-14.464 4.52Z" />
    </svg>
  )
}

export const HomePageTestimonials = () => {
  return (
    <section id="testimonials" className="bg-gray-50 py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl md:text-center">
          <h2 className="font-display text-3xl tracking-tight text-gray-900 sm:text-4xl">
            Loved by businesses worldwide.
          </h2>
          <p className="mt-4 text-lg tracking-tight text-gray-700">
            Our software is so simple that people can’t help but fall in love with it. Simplicity is
            easy when you just skip tons of mission-critical features.
          </p>
        </div>
        <ul className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:gap-8 lg:mt-20 lg:max-w-none lg:grid-cols-3">
          {testimonials.map((column, columnIndex) => (
            <li key={columnIndex}>
              <ul className="flex flex-col gap-y-6 sm:gap-y-8">
                {column.map((testimonial, testimonialIndex) => (
                  <li key={testimonialIndex}>
                    <figure className="relative rounded-2xl bg-white p-6 shadow-xl shadow-gray-900/10">
                      <QuoteIcon className="absolute top-6 left-6 fill-gray-100" />
                      <blockquote className="relative">
                        <p className="text-lg tracking-tight text-gray-900">
                          {testimonial.content}
                        </p>
                      </blockquote>
                      <figcaption className="relative mt-6 flex items-center justify-between border-t border-gray-100 pt-6">
                        <div>
                          <div className="font-display text-base text-gray-900">
                            {testimonial.author.name}
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            {testimonial.author.role}
                          </div>
                        </div>
                        <div className="overflow-hidden rounded-full bg-gray-50">
                          <Image
                            src={testimonial.author.image}
                            className="h-14 w-14 object-cover"
                            alt=""
                            width={56}
                            height={56}
                          />
                        </div>
                      </figcaption>
                    </figure>
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
