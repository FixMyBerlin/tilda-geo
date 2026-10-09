import { AreaWizard } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/area/AreaWizard'

/** ModePanel detail view for »Neues Planungsgebiet« (`space.new === 'area'`), driven by the existing wizard. */
export const SpaceFinderNewAreaDetail = ({
  onCreated,
}: {
  onCreated: (areaId: number, variantId: number) => void
}) => <AreaWizard onCreated={onCreated} />
