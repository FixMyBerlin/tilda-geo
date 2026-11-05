import { AreaEditor } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/area/AreaEditor'
import type { SpaceFinderAreaVariantRow } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/collection/spaceFinderCollectionOptions'
import type { SpaceFinderVariantDetail } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/spaceFinderVariantDetail'

/** ModePanel detail view for »Gebiet bearbeiten« (`space.edit === 'area'`), driven by the existing editor. */
export const SpaceFinderEditAreaDetail = ({
  area,
  variants,
  onClose,
}: {
  area: SpaceFinderVariantDetail['area']
  variants: SpaceFinderAreaVariantRow[]
  onClose: () => void
}) => <AreaEditor area={area} variants={variants} onClose={onClose} />
