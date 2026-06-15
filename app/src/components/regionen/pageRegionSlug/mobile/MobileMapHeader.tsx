import { MobileLayerButton } from './MobileLayerButton'
import { MobileRegionMenu } from './MobileRegionMenu'
import { MobileSearchButton } from './MobileSearchButton'
import { MobileUserMenu } from './MobileUserMenu'

/**
 * Mobile-only floating header overlaying the top of the map (replaces the dark
 * desktop header). Left: region menu + layers. Right: search + user.
 * `pointer-events-none` on the bar with auto on the controls keeps the map
 * pannable in the gap between the groups.
 */
export const MobileMapHeader = () => {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-2 sm:hidden [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
      <div className="flex items-start gap-2">
        <MobileRegionMenu />
        <MobileLayerButton />
      </div>
      <div className="flex items-start gap-2">
        <MobileSearchButton />
        <MobileUserMenu />
      </div>
    </div>
  )
}
