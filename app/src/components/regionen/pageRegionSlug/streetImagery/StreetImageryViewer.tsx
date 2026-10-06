import {
  providerById,
  providerExternalLink,
  type NormalizedPhoto,
} from '@osm-editor-kit/street-imagery'
import {
  FloatingPhotoViewer,
  PhotoDate,
  StreetLevelImageryViewer,
  useViewerActions,
} from '@osm-editor-kit/street-imagery-react'
import { useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { useBreakpoint } from '@/components/shared/hooks/viewport/useBreakpoint'
import { Link } from '@/components/shared/links/Link'
import { streetImageryProviderIds } from './streetImageryParam'
import {
  useShownStreetImageryPhoto,
  useStreetImageryViewerActions,
} from './useShownStreetImageryPhoto'
import { useStreetImageryParam } from './useStreetImageryParam'

const noop = () => {}

/** The photo of `?photos.photo` in a box floating over the map. */
export const StreetImageryViewer = () => {
  const { date, setPhoto } = useStreetImageryParam()
  const { photo, sequencePhotos } = useShownStreetImageryPhoto()
  const { setViewerPhoto } = useStreetImageryViewerActions()
  const viewerActions = useViewerActions()
  const { mainMap } = useMap()
  const isDesktop = useBreakpoint('sm')
  // The viewers' own attribution is off; the footer shows creator and licence, which only the
  // viewer knows once it has loaded the photo.
  const [loadedPhoto, setLoadedPhoto] = useState<NormalizedPhoto | null>(null)

  if (!photo) return null

  const shown = loadedPhoto?.photoId === photo.photoId ? loadedPhoto : null
  // Mapillary's licence is the same for every image; Panoramax states it per photo.
  const license =
    shown?.details?.license ?? (photo.providerId === 'mapillary' && shown ? 'CC BY-SA 4.0' : null)

  // The provider's own site opens with the date filter of the map, where it has one (Mapillary).
  const externalUrl = new URL(providerExternalLink(photo))
  if (photo.providerId === 'mapillary') {
    if (date.from) externalUrl.searchParams.set('dateFrom', date.from)
    if (date.to) externalUrl.searchParams.set('dateTo', date.to)
  }

  const close = () => {
    setPhoto(undefined)
    setViewerPhoto(null)
    viewerActions.reset()
  }

  return (
    <FloatingPhotoViewer
      title={providerById[photo.providerId].label}
      storageKey="tilda-street-imagery-viewer"
      // Top left, right of the layer controls (their width plus the map's inset).
      defaultPosition={{ corner: 'top-left', left: isDesktop ? 240 : 8, top: isDesktop ? 12 : 64 }}
      // TILDA shows single photos; the package's suggested views and history are not used.
      suggestions={[]}
      activeDirectionKey={null}
      onSelectSuggestion={noop}
      onClose={close}
      footer={
        <div className="flex items-center justify-between gap-3 text-xs">
          <p className="min-w-0 truncate">
            <PhotoDate timestamp={photo.capturedAt} />
            {photo.isPano ? ' · 360°' : ''}
            {shown?.creatorName ? ` · ${shown.creatorName}` : ''}
            {license ? ' · ' : ''}
            {license && shown?.details?.licenseUrl ? (
              <Link blank href={shown.details.licenseUrl}>
                {license}
              </Link>
            ) : (
              license
            )}
          </p>
          <Link blank href={externalUrl.toString()} className="flex-none">
            In {providerById[photo.providerId].label} öffnen
          </Link>
        </div>
      }
    >
      <div className="px-2">
        <StreetLevelImageryViewer
          photo={photo}
          groupPhotos={sequencePhotos}
          hideAttribution
          onViewerPhoto={(viewerPhoto) => {
            setLoadedPhoto(viewerPhoto)
            setViewerPhoto(viewerPhoto)
          }}
          onPhotoSelected={({ provider, photoId, sequenceId }) => {
            const known = streetImageryProviderIds.find((id) => id === provider)
            if (!known) return
            // Without a sequence the viewers report `photo:<id>`; that is not a sequence id.
            const sequence = sequenceId.startsWith('photo:') ? undefined : sequenceId
            setPhoto({ provider: known, id: photoId, sequence })
          }}
          onEaseMapToPoint={(lng, lat) => mainMap?.easeTo({ center: [lng, lat] })}
        />
      </div>
    </FloatingPhotoViewer>
  )
}
