import { AreaEditor } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/area/AreaEditor'
import type { PlanningAreaVariantRow } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/collection/spaceFinderCollectionOptions'
import type { PlanningVariantDetail } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/spaceFinderVariantDetail'

/** ModePanel detail view for »Gebiet bearbeiten« (`space.edit === 'area'`), driven by the existing editor. */
export const SpaceFinderEditAreaDetail = ({
  area,
  variants,
  regionSlug,
  onClose,
}: {
  area: PlanningVariantDetail['area']
  variants: PlanningAreaVariantRow[]
  regionSlug: string
  onClose: () => void
}) => (
  <div className="px-4 py-3">
    <AreaEditor
      area={area}
      variants={variants}
      regionSlug={regionSlug}
      onClose={onClose}
      onDeleted={onClose}
    />
  </div>
)
