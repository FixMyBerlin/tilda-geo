import { MAP_STYLE_URL } from '@/src/app/api/map-style/_utils/mapStyleUrl.const'
import { MapPinIcon, PlusIcon } from '@heroicons/react/24/solid'
import { bbox } from '@turf/turf'
import { useState } from 'react'
import {
  AttributionControl,
  Map as MapGl,
  MapProps,
  Marker,
  NavigationControl,
  type ViewStateChangeEvent,
} from 'react-map-gl/maplibre'
import { useOsmNewNoteFeature } from '../../../_hooks/mapState/userMapNotes'
import { useNewInternalNoteMapParam } from '../../../_hooks/useQueryState/useNotesAtlasParams'
import { useNewOsmNoteMapParam } from '../../../_hooks/useQueryState/useNotesOsmParams'
import { SourceLayerFeature } from './SourceLayerFeature'
import { SourceLayerForRegion } from './SourceLayerForRegion'

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
    <section className="relative min-h-80">
      <div className="absolute inset-x-1 top-4 z-10 flex justify-center">
        <h2 className="rounded-lg bg-teal-700 px-2 py-1 font-semibold leading-tight text-teal-50">
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
        RTLTextPlugin={false}
        minZoom={3}
        attributionControl={false}
      >
        <NavigationControl showCompass={false} position="bottom-left" />
        <AttributionControl compact={true} position="bottom-right" />

        <Marker latitude={newNoteMapParam.lat} longitude={newNoteMapParam.lng} anchor="bottom">
          <MapPinIcon className="h-8 w-8 text-red-700" />
          <PlusIcon className="-mb-4 h-8 w-8 text-red-700" />
        </Marker>

        <SourceLayerFeature />
        <SourceLayerForRegion />
      </MapGl>

      {showHint && (
        <div className="pointer-events-none absolute inset-x-20 bottom-20 z-50 rounded-sm bg-white/90 p-2 text-center leading-tight">
          Bewegen Sie die Karte, um das rote Kreuz dort zu positionieren, wo Sie Ihren Kommentar
          eintragen möchten.
        </div>
      )}
    </section>
  )
}
