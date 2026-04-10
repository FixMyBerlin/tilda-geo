import { Spinner } from '@/components/shared/Spinner/Spinner'

export default function DefaultPending() {
  return (
    <div
      className="flex min-h-full w-full grow flex-col bg-white"
      aria-live="polite"
      aria-busy="true"
    >
      <main className="mx-auto flex w-full max-w-7xl grow flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="py-16">
          <div className="text-center">
            <Spinner className="mx-auto" color="yellow" screenReaderLabel={false} size="8" />
            <p className="mt-4 text-base text-gray-500">Laden …</p>
          </div>
        </div>
      </main>
    </div>
  )
}
