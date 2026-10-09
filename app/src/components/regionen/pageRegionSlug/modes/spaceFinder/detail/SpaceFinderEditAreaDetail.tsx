import { AreaEditor } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/area/AreaEditor'
import type { PlanningAreaVariantRow } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/collection/spaceFinderCollectionOptions'
import type { PlanningVariantDetail } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/spaceFinderVariantDetail'

/** ModePanel detail view for »Gebiet bearbeiten« (`space.edit === 'area'`), driven by the existing editor. */
export const SpaceFinderEditAreaDetail = ({
  area,
  variants,
  onClose,
}: {
  area: PlanningVariantDetail['area']
  variants: PlanningAreaVariantRow[]
  onClose: () => void
}) => <AreaEditor area={area} variants={variants} onClose={onClose} />
