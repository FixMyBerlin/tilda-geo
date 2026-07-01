import { useBreakpoint } from '@/components/shared/hooks/viewport/useBreakpoint'
import { DebugButton } from '../DebugBoxes/DebugButton'
import { DownloadModal } from '../DownloadModal/DownloadModal'
import { PlaceSearch } from '../Map/Search/PlaceSearch'
import { mobileMapHeaderClassName } from './mobileMapChrome.const'
import { MobileRegionMenu } from './MobileRegionMenu'
import { MobileUserMenu } from './MobileUserMenu'

/**
 * Mobile-only floating header overlaying the top of the map (replaces the dark
 * desktop header). Left: region menu (logo + "Über") + user + download.
 * Right: search (+ admin debug). The layer control lives in the bottom controls
 * cluster on mobile. `pointer-events-none` on the bar with auto on the controls
 * keeps the map pannable in the gap between the groups.
 *
 * Renders nothing on desktop (returns null instead of CSS-hiding) so the whole
 * subtree — and its child controls/sheets — stays out of the DOM there.
 */
export const MobileMapHeader = () => {
  const isDesktop = useBreakpoint('sm')
  if (isDesktop) return null

  return (
    <div className={mobileMapHeaderClassName}>
      <div className="flex items-start gap-2">
        <MobileRegionMenu />
        <MobileUserMenu />
        <DownloadModal />
      </div>
      <div className="flex items-start gap-2">
        <DebugButton />
        <PlaceSearch />
      </div>
    </div>
  )
}
