import { Outlet } from '@tanstack/react-router'
import { twJoin } from 'tailwind-merge'
import { HeaderAppLogoBlack } from '@/components/layouts/Header/HeaderApp/HeaderAppLogo'
import {
  proseLayoutPagesHyphenationClasses,
  proseLayoutPagesInlineCodeClasses,
} from '@/components/shared/text/prose'

export function LayoutPages() {
  return (
    <main
      lang="de"
      className={twJoin(
        // `min-w-0` + `w-full` keep this flex child within the viewport; `wrap-break-word`
        // breaks long URLs/legal terms; Silbentrennung via `proseLayoutPagesHyphenationClasses` (esp. headlines);
        // `px-4` gives every content page a small mobile gutter.
        'z-0 mx-auto my-10 prose w-full max-w-prose min-w-0 grow px-4 wrap-break-word print:mx-0 print:my-0 print:max-w-none print:px-6',
        proseLayoutPagesHyphenationClasses,
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
