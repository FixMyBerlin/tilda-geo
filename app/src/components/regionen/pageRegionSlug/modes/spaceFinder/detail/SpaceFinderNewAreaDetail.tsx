import { AreaWizard } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/area/AreaWizard'

/** ModePanel detail view for »Neues Planungsgebiet« (`space.new === 'area'`), driven by the existing wizard. */
export const SpaceFinderNewAreaDetail = ({
  onCreated,
  onCancel,
}: {
  onCreated: (areaId: number, variantId: number) => void
  onCancel: () => void
}) => <AreaWizard onCreated={onCreated} onCancel={onCancel} />
