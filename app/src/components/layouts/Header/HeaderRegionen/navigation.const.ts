import { globalSecondaryNavigation } from '../HeaderApp/navigation.const'
import type { PrimaryNavigation, SecondaryNavigation } from '../types'

export const defaultPrimaryNavigation: PrimaryNavigation[] = [
  // { name: 'TILDA', href: '/regionen/:regionPath/' },
  // { name: 'Mitmachen', href: '/regionen/:regionPath/mitmachen' },
  // { name: 'Planungen', href: '#todo-planungen' },
  // { name: 'Analysen', href: '#tood-analysen' },
]

export const defaultSecondaryNavigationGrouped: SecondaryNavigation[][] = [
  [
    // { name: 'Startseite', href: '/' }, // hidden for regions
    ...globalSecondaryNavigation,
  ],
]
