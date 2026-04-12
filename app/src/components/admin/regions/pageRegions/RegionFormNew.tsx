import type { StaticRegion } from '@/data/regions.const'
import { RegionStatus } from '@/prisma/generated/browser'
import { RegionForm } from './RegionForm'

type Props = {
  creatableRegions: StaticRegion[]
  initialSlug?: string
}

export function RegionFormNew({ creatableRegions, initialSlug }: Props) {
  if (creatableRegions.length === 0) {
    return (
      <p className="text-gray-700">
        Alle Regionen aus der statischen Liste sind bereits in der Datenbank angelegt. Es gibt
        nichts mehr anzulegen.
      </p>
    )
  }

  const firstSlug = creatableRegions[0]?.slug ?? ''
  const slugDefault =
    initialSlug && creatableRegions.some((r) => r.slug === initialSlug) ? initialSlug : firstSlug

  return (
    <RegionForm
      mode="create"
      creatableRegions={creatableRegions}
      initialValues={{
        slug: slugDefault,
        promoted: 'false',
        status: RegionStatus.PUBLIC,
      }}
    />
  )
}
