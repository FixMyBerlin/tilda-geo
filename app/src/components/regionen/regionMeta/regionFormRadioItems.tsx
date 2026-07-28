import {
  regionPromotedDescription,
  regionPromotedFormLabel,
  regionStatusDescription,
  regionStatusFormLabel,
} from '@/data/regionLabels.const'
import type { RegionStatus } from '@/prisma/generated/browser'
import { RegionPromotedPill } from './RegionPromotedPill'
import { RegionStatusPill } from './RegionStatusPill'

const pillWithDescription = (pill: React.ReactNode, description: string) => (
  <span className="inline-flex flex-wrap items-center gap-2">
    {pill}
    <span className="text-gray-600">{description}</span>
  </span>
)

const regionStatuses = [
  'PUBLIC',
  'PRIVATE',
  'DEACTIVATED',
] as const satisfies readonly RegionStatus[]

export const regionStatusFormRadioItems = regionStatuses.map((status) => ({
  value: status,
  label: regionStatusFormLabel[status],
  labelContent: pillWithDescription(
    <RegionStatusPill status={status} />,
    regionStatusDescription[status],
  ),
}))

export const regionPromotedFormRadioItems = [
  {
    value: 'true' as const,
    label: regionPromotedFormLabel.true,
    labelContent: pillWithDescription(
      <RegionPromotedPill promoted />,
      regionPromotedDescription.true,
    ),
  },
  {
    value: 'false' as const,
    label: regionPromotedFormLabel.false,
    labelContent: pillWithDescription(
      <RegionPromotedPill promoted={false} />,
      regionPromotedDescription.false,
    ),
  },
]
