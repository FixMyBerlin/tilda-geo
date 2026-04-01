import { Outlet } from '@tanstack/react-router'

export function LayoutAdmin() {
  return (
    <div className="min-h-full bg-pink-300">
      <main className="prose mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
