import { ScrollReveal } from '@/components/shared/motion/ScrollReveal'
import { DemoButton } from './DemoButton'

export const HomePageCtaBanner = () => {
  return (
    <section className="bg-brand">
      <ScrollReveal className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
        <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
          Bereit für die digitale Verkehrsplanung?
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base text-gray-900/90 sm:text-lg">
          Lassen Sie uns gemeinsam schauen, wie TILDA Ihren Arbeitsalltag in der Verwaltung
          erleichtert.
        </p>
        <div className="mt-8 flex justify-center">
          <DemoButton variant="white" />
        </div>
      </ScrollReveal>
    </section>
  )
}
