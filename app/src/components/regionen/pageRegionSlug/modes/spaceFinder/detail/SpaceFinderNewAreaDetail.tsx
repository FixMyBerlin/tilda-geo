import { AreaWizard } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/area/AreaWizard'
import { useSpaceFinderModeParam } from '../useSpaceFinderModeParam'

/** ModePanel detail view for »Neues Planungsgebiet« (`ff.new === 'area'`), driven by the existing wizard. */
export const SpaceFinderNewAreaDetail = ({ regionSlug }: { regionSlug: string }) => {
  const { spaceFinderMode, setSpaceFinderModeParam } = useSpaceFinderModeParam()

  return (
    <div className="px-4 py-3">
      <AreaWizard
        regionSlug={regionSlug}
        onCreated={(_areaId, variantId) =>
          setSpaceFinderModeParam({ ...spaceFinderMode, key: variantId, new: undefined })
        }
        onCancel={() => setSpaceFinderModeParam({ ...spaceFinderMode, new: undefined })}
      />
    </div>
  )
}
