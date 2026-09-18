import { createContext, use } from 'react'

/** Jump list entry; `id` is the DOM id of the matching `AdminFormSection` (and the URL hash). */
export type AdminAsideSection = { id: string; label: string }

/** `{ identity: 'Identität', … }` → ordered jump list entries. Keep ids and titles in one record per page. */
export const toAdminAsideSections = (labels: Record<string, string>) =>
  Object.entries(labels).map(([id, label]) => ({ id, label }) satisfies AdminAsideSection)

/** Marks `AdminFormSection` roots so validation errors can be mapped to their section. */
export const adminSectionDataAttribute = 'data-admin-section'

const preferredScrollBehavior = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'

/** Scrolls to a section and mirrors it in the URL hash (without a router navigation). */
export const scrollToAdminSection = (id: string, behavior?: ScrollBehavior) => {
  const element = document.getElementById(id)
  if (!element) return false
  element.scrollIntoView({ behavior: behavior ?? preferredScrollBehavior(), block: 'start' })
  if (window.location.hash !== `#${id}`) {
    window.history.replaceState(window.history.state, '', `#${id}`)
  }
  return true
}

/** After a failed submit: jump to the first section with an `aria-invalid` field and focus it. */
export const scrollToFirstInvalidAdminSection = () => {
  const invalid = document.querySelector<HTMLElement>('[aria-invalid="true"]')
  const section = invalid?.closest<HTMLElement>(`[${adminSectionDataAttribute}]`)
  if (!invalid || !section) return
  scrollToAdminSection(section.id)
  invalid.focus({ preventScroll: true })
}

/**
 * `AdminAsideLayout` renders its `actions` twice — desktop card and mobile bar (plus the mobile
 * overflow menu for secondary links). Action components read this to pick their markup.
 */
export type AdminAsideVariant = 'desktop' | 'mobile' | 'mobileMenu'

export const AdminAsideVariantContext = createContext<AdminAsideVariant>('desktop')

export const useAdminAsideVariant = () => use(AdminAsideVariantContext)
