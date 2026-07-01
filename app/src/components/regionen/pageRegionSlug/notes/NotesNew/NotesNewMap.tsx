import { MapPinIcon, PlusIcon } from '@heroicons/react/24/solid'
import { bbox } from '@turf/turf'
import { useState } from 'react'
import type { MapProps, ViewStateChangeEvent } from 'react-map-gl/maplibre'
import { AttributionControl, Map as MapGl, Marker, NavigationControl } from 'react-map-gl/maplibre'
import { useOsmNewNoteFeature } from '@/components/regionen/pageRegionSlug/hooks/mapState/userMapNotes'
import type { useNewInternalNoteMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesAtlasParams'
import type { useNewOsmNoteMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesOsmParams'
import { useBreakpoint } from '@/components/shared/hooks/viewport/useBreakpoint'
import { MAP_STYLE_URL } from '@/server/api/map-style/mapStyleUrl.const'
import { NotesMapLayerForRegion } from './NotesMapLayerForRegion'
import { SourceLayerFeature } from './SourceLayerFeature'

type Props = {
  mapId: 'newInternalNoteMap' | 'newOsmNoteMap'
  newNoteMapParam:
    | ReturnType<typeof useNewOsmNoteMapParam>['newOsmNoteMapParam']
    | ReturnType<typeof useNewInternalNoteMapParam>['newInternalNoteMapParam']
  setNewNoteMapParam:
    | ReturnType<typeof useNewOsmNoteMapParam>['setNewOsmNoteMapParam']
    | ReturnType<typeof useNewInternalNoteMapParam>['setNewInternalNoteMapParam']
}

export const NotesNewMap = ({ mapId, newNoteMapParam, setNewNoteMapParam }: Props) => {
  const [showHint, setShowHint] = useState(true)
  const isSmBreakpointOrAbove = useBreakpoint('sm')

  const handleMove = (event: ViewStateChangeEvent) => {
    setNewNoteMapParam({
      zoom: event.viewState.zoom,
      lat: event.viewState.latitude,
      lng: event.viewState.longitude,
    })
    setShowHint(false)
  }

  let initialViewState: MapProps['initialViewState'] = {
    zoom: newNoteMapParam?.zoom,
    latitude: newNoteMapParam?.lat,
    longitude: newNoteMapParam?.lng,
  }
  const osmNewNoteFeature = useOsmNewNoteFeature()
  if (osmNewNoteFeature) {
    initialViewState = {
      bounds: bbox(osmNewNoteFeature.geometry) as [number, number, number, number],
      fitBoundsOptions: { padding: 100, maxZoom: 17 },
    }
  }

  if (!newNoteMapParam) return null

  return (
    <section className="relative h-[min(240px,30dvh)] min-h-[220px] w-full sm:h-auto sm:min-h-80">
      <div className="absolute inset-x-1 top-2 z-10 flex justify-center sm:top-4">
        <h2 className="rounded-lg bg-teal-700 px-2 py-1 text-sm leading-tight font-semibold text-teal-50 sm:text-base">
          1. Position bestimmen
        </h2>
      </div>

      <MapGl
        id={mapId}
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE_URL}
        interactiveLayerIds={[]}
        cursor={'grab'}
        onMoveEnd={handleMove}
        onMove={handleMove}
        doubleClickZoom={true}
        dragRotate={false}
        minZoom={3}
        attributionControl={false}
      >
        <Marker latitude={newNoteMapParam.lat} longitude={newNoteMapParam.lng} anchor="bottom">
          <MapPinIcon className="h-8 w-8 text-red-700" />
          <PlusIcon className="-mb-4 h-8 w-8 text-red-700" />
        </Marker>

        <SourceLayerFeature />
        <NotesMapLayerForRegion />
        <AttributionControl compact={true} position="bottom-left" />

        {isSmBreakpointOrAbove && <NavigationControl showCompass={false} position="bottom-left" />}
      </MapGl>

      {showHint && (
        <div className="pointer-events-none absolute inset-x-4 bottom-2 z-50 rounded-sm bg-white/90 p-1.5 text-center text-sm leading-tight sm:inset-x-20 sm:bottom-20 sm:p-2 sm:text-base">
          Bewegen Sie die Karte, um das rote Kreuz dort zu positionieren, wo Sie Ihren Kommentar
          eintragen möchten.
        </div>
      )}
    </section>
  )
}
