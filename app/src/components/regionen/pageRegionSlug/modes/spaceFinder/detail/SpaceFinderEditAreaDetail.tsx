import { AreaEditor } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/area/AreaEditor'

/** ModePanel detail view for »Gebiet bearbeiten« (`ff.edit === 'area'`), driven by the existing editor. */
export const SpaceFinderEditAreaDetail = ({
  areaId,
  regionSlug,
  onClose,
}: {
  areaId: number
  regionSlug: string
  onClose: () => void
}) => (
  <div className="px-4 py-3">
    <AreaEditor areaId={areaId} regionSlug={regionSlug} onClose={onClose} onDeleted={onClose} />
  </div>
)
