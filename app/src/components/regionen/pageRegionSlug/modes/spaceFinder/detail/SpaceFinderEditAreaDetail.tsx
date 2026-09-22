import { AreaEditor } from '@/components/regionen/pageRegionSlug/Planning/AreaEditor'
import { useSpaceFinderModeParam } from '../useSpaceFinderModeParam'

/** ModePanel detail view for »Gebiet bearbeiten« (`ff.edit === 'area'`), driven by the existing editor. */
export const SpaceFinderEditAreaDetail = ({
  areaId,
  regionSlug,
}: {
  areaId: number
  regionSlug: string
}) => {
  const { spaceFinderMode, setSpaceFinderModeParam } = useSpaceFinderModeParam()
  const closeEdit = () => setSpaceFinderModeParam({ ...spaceFinderMode, edit: undefined })

  return (
    <div className="px-4 py-3">
      <AreaEditor
        areaId={areaId}
        regionSlug={regionSlug}
        onClose={closeEdit}
        onDeleted={closeEdit}
      />
    </div>
  )
}
