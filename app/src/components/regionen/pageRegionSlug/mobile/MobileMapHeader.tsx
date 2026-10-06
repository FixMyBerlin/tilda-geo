import { AdminPanelTrigger } from '@/components/layouts/Header/User/AdminPanelTrigger'
import { useBreakpoint } from '@/components/shared/hooks/viewport/useBreakpoint'
import { DebugButton } from '../DebugBoxes/DebugButton'
import { RegionDataModals } from '../DownloadModal/RegionDataModals'
import { PlaceSearch } from '../Map/Search/PlaceSearch'
import { mobileMapHeaderClassName } from './mobileMapChrome.const'
import { MobileModeSwitcher } from './MobileModeSwitcher'
import { MobileRegionMenu } from './MobileRegionMenu'
import { MobileUserMenu } from './MobileUserMenu'

/**
 * Mobile-only floating header overlaying the top of the map (replaces the dark
 * desktop header). Left: region menu (logo + name) with the mode switcher stacked
 * below it. Right: user, search, download (right-to-left); admin/debug (pink)
 * sit on a second row so they never crowd the primary controls. The layer
 * control lives in the bottom controls cluster. `pointer-events-none` on the bar
 * with auto on the controls keeps the map pannable in the gap between the groups.
 *
 * Renders nothing on desktop (returns null instead of CSS-hiding) so the whole
 * subtree — and its child controls/sheets — stays out of the DOM there.
 */
export const MobileMapHeader = () => {
  const isDesktop = useBreakpoint('sm')
  if (isDesktop) return null

  return (
    <div className={mobileMapHeaderClassName}>
      <div className="flex flex-col items-start gap-2">
        <MobileRegionMenu />
        <MobileModeSwitcher />
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-start gap-2">
          <RegionDataModals />
          <PlaceSearch />
          <MobileUserMenu />
        </div>
        <div className="flex items-start gap-2">
          <AdminPanelTrigger variant="mapControl" />
          <DebugButton />
        </div>
      </div>
    </div>
  )
}
