import type { NormalizedPhoto } from '@osm-editor-kit/street-imagery'
import { useAllProviderPhotos, useMapViewportBbox } from '@osm-editor-kit/street-imagery-react'
import { create } from 'zustand'
import { useMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useMapParam'
import { useStreetImageryParam } from './useStreetImageryParam'

type Store = {
  /** The last photo the viewer loaded: it may be outside of what the map has loaded. */
  viewerPhoto: NormalizedPhoto | null
  actions: { setViewerPhoto: (photo: NormalizedPhoto | null) => void }
}

const useStreetImageryViewerStore = create<Store>((set) => ({
  viewerPhoto: null,
  actions: { setViewerPhoto: (viewerPhoto) => set({ viewerPhoto }) },
}))

export const useStreetImageryViewerActions = () =>
  useStreetImageryViewerStore((state) => state.actions)

/**
 * The photo of `?photos.photo` with its data (position, date …). The URL only holds its id; the
 * data comes from the photos loaded for the map, or from the viewer once it has loaded the photo.
 */
export const useShownStreetImageryPhoto = () => {
  const { providers, photo: selected } = useStreetImageryParam()
  const { mapParam } = useMapParam()
  const bbox = useMapViewportBbox('mainMap', mapParam)
  const { photos } = useAllProviderPhotos(providers, selected ? bbox : null, mapParam.zoom)
  const viewerPhoto = useStreetImageryViewerStore((state) => state.viewerPhoto)

  if (!selected) return { photo: null, sequencePhotos: [] }

  const matches = (photo: NormalizedPhoto | null) =>
    photo?.providerId === selected.provider && photo.photoId === selected.id
  const photo = photos.find(matches) ?? (matches(viewerPhoto) ? viewerPhoto : null)
  if (!photo) return { photo: null, sequencePhotos: [] }

  const sequencePhotos = photo.sequenceId
    ? photos.filter(
        (other) => other.providerId === photo.providerId && other.sequenceId === photo.sequenceId,
      )
    : []

  return { photo, sequencePhotos: sequencePhotos.length > 0 ? sequencePhotos : [photo] }
}
