import { fetchMapillaryImages, type NormalizedPhoto } from '@osm-editor-kit/street-imagery'
import { useAllProviderPhotos, useMapViewportBbox } from '@osm-editor-kit/street-imagery-react'
import { useQuery } from '@tanstack/react-query'
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
 * A Mapillary photo that is neither (opened from the inspector with the layer off, or from a
 * link) is looked up by its id.
 */
export const useShownStreetImageryPhoto = () => {
  const { providers, photo: selected } = useStreetImageryParam()
  const { mapParam } = useMapParam()
  const bbox = useMapViewportBbox('mainMap')
  const { photos } = useAllProviderPhotos(providers, selected ? bbox : null, mapParam.zoom)
  const viewerPhoto = useStreetImageryViewerStore((state) => state.viewerPhoto)

  const matches = (photo: NormalizedPhoto | null) =>
    selected != null && photo?.providerId === selected.provider && photo.photoId === selected.id
  const loadedPhoto = photos.find(matches) ?? (matches(viewerPhoto) ? viewerPhoto : null)

  const mapillaryId = selected?.provider === 'mapillary' && !loadedPhoto ? selected.id : undefined
  const { data: lookedUpPhoto = null } = useQuery({
    queryKey: ['streetImageryMapillaryPhoto', mapillaryId],
    queryFn: async ({ signal }): Promise<NormalizedPhoto | null> => {
      const [image] = await fetchMapillaryImages(mapillaryId ? [mapillaryId] : [], signal)
      const lngLat = image?.lngLat ?? image?.originalLngLat
      if (!image || !lngLat) return null
      return {
        providerId: 'mapillary',
        photoId: image.id,
        sequenceId: image.sequenceId,
        capturedAt: image.capturedAt,
        isPano: image.isPano,
        heading: image.heading,
        lngLat,
      }
    },
    enabled: Boolean(mapillaryId),
    staleTime: Infinity,
  })

  const photo = loadedPhoto ?? (matches(lookedUpPhoto) ? lookedUpPhoto : null)
  if (!photo) return { photo: null, sequencePhotos: [] }

  const sequencePhotos = photo.sequenceId
    ? photos.filter(
        (other) => other.providerId === photo.providerId && other.sequenceId === photo.sequenceId,
      )
    : []

  return { photo, sequencePhotos: sequencePhotos.length > 0 ? sequencePhotos : [photo] }
}
