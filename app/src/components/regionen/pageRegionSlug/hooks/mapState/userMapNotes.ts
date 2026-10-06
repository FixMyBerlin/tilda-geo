import type { Geometry } from 'geojson'
import { create } from 'zustand'
import type { OsmTypeIdNonNull } from '../../../../../components/regionen/pageRegionSlug/SidebarInspector/Tools/osmUrls/extractOsmTypeIdByConfig'

// INFO DEBUGGING: We could use a middleware to log state changes https://github.com/pmndrs/zustand#middleware

export type Store = StoreOsmNewNoteFeature & StorenewNoteTildaDeeplink

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

const useMapNotes = create<Store>()((set) => {
  return {
    // Data for notes compose (related OSM object + deeplink footer)
    osmNewNoteFeature: undefined,
    newNoteTildaDeeplink: undefined,

    actions: {
      setOsmNewNoteFeature: (osmNewNoteFeature) => set({ osmNewNoteFeature }),
      setNewNoteTildaDeeplink: (newNoteTildaDeeplink) => set({ newNoteTildaDeeplink }),
    },
  }
})

export const useOsmNewNoteFeature = () => useMapNotes((state) => state.osmNewNoteFeature)
export const useNewNoteTildaDeeplink = () => useMapNotes((state) => state.newNoteTildaDeeplink)
export const useOsmNotesActions = () => useMapNotes((state) => state.actions)
