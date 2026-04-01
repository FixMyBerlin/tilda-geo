import { Outlet } from '@tanstack/react-router'

export function LayoutPages() {
  return (
    <main className="prose z-0 mx-auto my-10 max-w-prose grow">
      <Outlet />
    </main>
  )
}
