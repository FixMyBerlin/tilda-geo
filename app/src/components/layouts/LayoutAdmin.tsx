import { Outlet } from '@tanstack/react-router'

/** Admin shell — pink page chrome matches AdminPanelTrigger / admin form legends. */
export function LayoutAdmin() {
  return (
    <div className="min-h-full w-full min-w-0 bg-pink-300">
      <main className="mx-auto w-full max-w-4xl min-w-0 px-4 py-10 text-gray-900 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
