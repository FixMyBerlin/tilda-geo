import type { RegionStatus } from '@prisma/client'
import { RegionForm } from './RegionForm'

type Props = {
  initialSlug: string
  initialPromoted: 'true' | 'false'
  initialStatus: RegionStatus
}

export function RegionFormEdit({ initialSlug, initialPromoted, initialStatus }: Props) {
  return (
    <RegionForm
      mode="edit"
      initialValues={{
        slug: initialSlug,
        promoted: initialPromoted,
        status: initialStatus,
      }}
    />
  )
}
