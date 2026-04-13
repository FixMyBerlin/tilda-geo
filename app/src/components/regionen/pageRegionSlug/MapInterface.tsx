import maplibregl from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import { useEffect } from 'react'
import { MapProvider } from 'react-map-gl/maplibre'
import { BackgroundLegend } from './background/BackgroundLegend'
import { SelectBackground } from './background/SelectBackground'
import { DebugMap } from './DebugBoxes/DebugMap'
import { DebugStateInteraction } from './DebugBoxes/DebugStateInteraction'
import { DownloadModal } from './DownloadModal/DownloadModal'
import { LoadingIndicator } from './LoadingIndicator/LoadingIndicator'
import { RegionMap } from './Map/RegionMap'
import { InternalNotes } from './notes/InternalNotes/InternalNotes'
import { OsmNotes } from './notes/OsmNotes/OsmNotes'
import { SidebarInspector } from './SidebarInspector/SidebarInspector'
import { SidebarLayerControls } from './SidebarLayerControls/SidebarLayerControls'

export const MapInterface = () => {
  useEffect(function registerPmtilesProtocolOnMount() {
    const protocol = new Protocol()
    maplibregl.addProtocol('pmtiles', protocol.tile)
    return function removePmtilesProtocolOnUnmount() {
      maplibregl.removeProtocol('pmtiles')
    }
  }, [])

  return (
    <MapProvider>
      <div className="relative flex h-full w-full flex-row gap-4">
        <RegionMap />
        <SidebarLayerControls />
        <SidebarInspector />
        <div
          className="pointer-events-none fixed right-2.5 bottom-4 z-10 mt-2.5 flex max-w-full flex-wrap items-end justify-end gap-1.5 *:pointer-events-auto"
          data-map-controls="true"
        >
          <LoadingIndicator />
          <OsmNotes />
          <InternalNotes />
          <DownloadModal />
          <BackgroundLegend />
          <SelectBackground />
        </div>
        <DebugMap />
        <DebugStateInteraction />
      </div>
    </MapProvider>
  )
}
