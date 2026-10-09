import { AreaWizard } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/area/AreaWizard'

/** ModePanel detail view for »Neues Planungsgebiet« (`space.new === 'area'`), driven by the existing wizard. */
export const SpaceFinderNewAreaDetail = ({
  regionSlug,
  onCreated,
  onClose,
}: {
  regionSlug: string
  onCreated: (areaId: number, variantId: number) => void
  onClose: () => void
}) => (
  <div className="px-4 py-3">
    <AreaWizard regionSlug={regionSlug} onCreated={onCreated} onCancel={onClose} />
  </div>
)
