import { Outlet } from '@tanstack/react-router'

export function LayoutPages() {
  return (
    <main className="z-0 mx-auto my-10 prose max-w-prose grow">
      <Outlet />
    </main>
  )
}
