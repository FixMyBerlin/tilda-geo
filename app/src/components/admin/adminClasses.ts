import { twJoin } from 'tailwind-merge'

// Page frame — `LayoutAdmin` applies padding + width, so pages render content only.
export const adminPagePaddingClassName = 'px-4 py-6 sm:px-6 lg:px-8'
export const adminPageWidthClassName = 'mx-auto w-full max-w-7xl'

export const adminPageTitleClassName =
  'text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl'

export const adminCardClassName = 'rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5'

/** Bulleted lists in admin screens — shared markers, spacing, and body text color. */
export const adminBulletedListClassName =
  'list-outside list-disc space-y-1 pl-5 text-gray-900 marker:text-current'

// Sticky form aside (`components/admin/aside/`): desktop column next to the form, mobile bar below `AdminMobileTopBar` (`h-14`).
export const adminAsideLayoutClassName = 'flex items-start gap-x-8'
export const adminAsideMainClassName = 'max-w-4xl min-w-0 flex-1 space-y-8'
export const adminAsideClassName = 'sticky top-6 hidden w-64 shrink-0 lg:flex lg:flex-col lg:gap-4'
export const adminAsideMobileBarClassName = 'sticky top-14 z-30 lg:hidden'
export const adminAsideJumpItemClassName = twJoin(
  'block w-full rounded-md px-3 py-1.5 text-left text-sm text-gray-600 no-underline',
  'hover:bg-white/70 hover:text-gray-900',
)
export const adminAsideJumpItemActiveClassName = twJoin(
  adminAsideJumpItemClassName,
  'bg-white font-medium text-gray-900 ring-1 ring-gray-900/5 hover:bg-white',
)
/** Icon-only action in the mobile aside bar (cancel, overflow menu, delete). */
export const adminAsideIconButtonClassName = twJoin(
  'inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-white text-gray-600 shadow-xs ring-1 ring-gray-300',
  'hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500',
)
/** Keeps section headings clear of the mobile top bar + aside bar (mobile) or the page top (desktop). */
export const adminFormSectionScrollMarginClassName = 'scroll-mt-28 lg:scroll-mt-6'
/** `IntersectionObserver` band for the scroll-spy: a section is active while it crosses the upper third. */
export const adminActiveSectionRootMargin = '-25% 0px -65% 0px'
