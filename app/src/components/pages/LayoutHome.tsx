import { Outlet } from '@tanstack/react-router'

export function LayoutHome() {
  return (
    <main className="z-0 grow">
      <Outlet />
    </main>
  )
}
