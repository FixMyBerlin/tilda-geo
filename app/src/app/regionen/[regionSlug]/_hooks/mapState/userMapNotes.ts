import { featureCollection } from '@turf/turf'
import type { FeatureCollection, Geometry, Point } from 'geojson'
import { create } from 'zustand'
import { OsmTypeIdNonNull } from '../../_components/SidebarInspector/Tools/osmUrls/extractOsmTypeIdByConfig'
import { OsmApiNotesThreadType } from '../../_components/notes/OsmNotes/schema'

// INFO DEBUGGING: We could use a middleware to log state changes https://github.com/pmndrs/zustand#middleware

export type Store = StoreOsmNotesFeatures & StoreOsmNewNoteFeature & StorenewNoteTildaDeeplink

type StoreOsmNotesFeatures = {
  osmNotesFeatures: FeatureCollection<Point, OsmApiNotesThreadType>
  actions: { setOsmNotesFeatures: (osmNotesFeatures: Store['osmNotesFeatures']) => void }
}

type StoreOsmNewNoteFeature = {
  osmNewNoteFeature: ({ geometry: Geometry } & OsmTypeIdNonNull) | undefined
  actions: { setOsmNewNoteFeature: (osmNewNoteFeature: Store['osmNewNoteFeature']) => void }
}

type StorenewNoteTildaDeeplink = {
  newNoteTildaDeeplink: string | undefined
  actions: {
    setNewNoteTildaDeeplink: (newNoteTildaDeeplink: Store['newNoteTildaDeeplink']) => void
  }
}

const useMapNotes = create<Store>((set) => {
  return {
    // Data for <Inspector> AND <SourcesLayersOsmNotes>
    osmNotesFeatures: featureCollection([]),
    // Data for <OsmNotesNew>, <InternalNotesNew>
    osmNewNoteFeature: undefined,
    newNoteTildaDeeplink: undefined,

    actions: {
      setOsmNotesFeatures: (osmNotesFeatures) => set({ osmNotesFeatures }),
      setOsmNewNoteFeature: (osmNewNoteFeature) => set({ osmNewNoteFeature }),
      setNewNoteTildaDeeplink: (newNoteTildaDeeplink) => set({ newNoteTildaDeeplink }),
    },
  }
})

export const useOsmNotesFeatures = () => useMapNotes((state) => state.osmNotesFeatures)
export const useOsmNewNoteFeature = () => useMapNotes((state) => state.osmNewNoteFeature)
export const useNewNoteTildaDeeplink = () => useMapNotes((state) => state.newNoteTildaDeeplink)
export const useOsmNotesActions = () => useMapNotes((state) => state.actions)
