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
            <div
              className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-yellow-400"
              aria-hidden="true"
            />
            <p className="mt-4 text-base text-gray-500">Laden …</p>
          </div>
        </div>
      </main>
    </div>
  )
}
