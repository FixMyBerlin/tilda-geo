import type { RegionStatus } from '@/prisma/generated/browser'

export const regionStatusPillLabel = {
  PUBLIC: 'Öffentlich',
  PRIVATE: 'Privat',
  DEACTIVATED: 'Deaktiviert',
} as const satisfies Record<RegionStatus, string>

export const regionStatusDescription = {
  PUBLIC: 'Jeder kann ansehen',
  PRIVATE: 'Nur Mitglieder',
  DEACTIVATED: 'Nur Admins',
} as const satisfies Record<RegionStatus, string>

export const regionStatusFormLabel = {
  PUBLIC: `${regionStatusPillLabel.PUBLIC} (${regionStatusDescription.PUBLIC})`,
  PRIVATE: `${regionStatusPillLabel.PRIVATE} (${regionStatusDescription.PRIVATE})`,
  DEACTIVATED: `${regionStatusPillLabel.DEACTIVATED} (${regionStatusDescription.DEACTIVATED})`,
} as const satisfies Record<RegionStatus, string>

export const regionPromotedPillLabel = {
  true: 'Gelistet',
  false: 'Nicht gelistet',
} as const

export const regionPromotedDescription = {
  true: 'Auf /regions Seite gelistet',
  false: 'Nur über Deeplink erreichbar',
} as const

export const regionPromotedFormLabel = {
  true: `${regionPromotedPillLabel.true} (${regionPromotedDescription.true})`,
  false: `${regionPromotedPillLabel.false} (${regionPromotedDescription.false})`,
} as const
