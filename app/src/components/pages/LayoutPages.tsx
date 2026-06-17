import { Outlet } from '@tanstack/react-router'
import { twJoin } from 'tailwind-merge'
import { HeaderAppLogoBlack } from '@/components/shared/layouts/Header/HeaderApp/HeaderAppLogo'
import { proseLayoutPagesInlineCodeClasses } from '@/components/shared/text/prose'

export function LayoutPages() {
  return (
    <main
      className={twJoin(
        // `min-w-0` lets this flex column shrink below wide children (e.g. tables) instead of
        // overflowing the viewport; `px-4` gives every content page a small mobile gutter.
        'z-0 mx-auto my-10 prose max-w-prose min-w-0 grow px-4 print:mx-0 print:my-0 print:max-w-none print:px-6',
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
