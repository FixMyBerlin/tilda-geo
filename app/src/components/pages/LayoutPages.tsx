import { Outlet } from '@tanstack/react-router'
import { twJoin } from 'tailwind-merge'
import { HeaderAppLogoBlack } from '@/components/shared/layouts/Header/HeaderApp/HeaderAppLogo'
import { proseLayoutPagesInlineCodeClasses } from '@/components/shared/text/prose'

export function LayoutPages() {
  return (
    <main
      className={twJoin(
        'z-0 mx-auto my-10 prose max-w-prose grow print:mx-0 print:my-0 print:max-w-none print:px-6',
        proseLayoutPagesInlineCodeClasses,
      )}
    >
      <header className="hidden border-b border-gray-300 pb-2 print:mb-4 print:block">
        <HeaderAppLogoBlack />
      </header>
      <Outlet />
    </main>
  )
}
