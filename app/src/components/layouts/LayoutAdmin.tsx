import { Outlet } from '@tanstack/react-router'

export function LayoutAdmin() {
  return (
    <main className="mx-auto min-h-full w-full max-w-4xl min-w-0 bg-pink-300 px-4 py-10 text-gray-900 sm:px-6 lg:px-8">
      <Outlet />
    </main>
  )
}
