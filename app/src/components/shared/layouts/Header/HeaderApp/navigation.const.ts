import type { PrimaryNavigation, SecondaryNavigation } from '../types'

export const primaryNavigation: PrimaryNavigation[] = [
  { name: 'Start', to: '/' },
  { name: 'Regionen', to: '/regionen' },
  // { name: 'Über', to: '/ueber' },
]

export const globalSecondaryNavigation: SecondaryNavigation[] = [
  { name: 'Feedback', to: '/kontakt', hash: 'feedback' },
  { name: 'Datenschutz', to: '/datenschutz' },
  { name: 'Kontakt & Impressum', to: '/kontakt' },
]

export const secondaryNavigationGrouped: SecondaryNavigation[][] = [[...globalSecondaryNavigation]]
