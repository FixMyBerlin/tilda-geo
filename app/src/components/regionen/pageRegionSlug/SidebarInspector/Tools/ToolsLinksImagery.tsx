import { LockClosedIcon } from '@heroicons/react/16/solid'
import {
  getLocationOpenersAt,
  type LocationOpener,
  type OpenTarget,
} from '@osm-editor-kit/street-imagery'
import { useQuery } from '@tanstack/react-query'
import { format, subYears } from 'date-fns'
import { useState } from 'react'
import { useMapInspectorClickLngLat } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useMapParam'
import { Link } from '@/components/shared/links/Link'
import { Spinner } from '@/components/shared/Spinner/Spinner'
import { imageryMaxAgeYears, imageryOpenerIds } from './imageryLinks.const'
import { pointNearClick } from './osmUrls/pointNearClick'

type Props = {
  geometry: GeoJSON.Geometry
}

export const ToolsLinksImagery = ({ geometry }: Props) => {
  const { mapParam } = useMapParam()
  const clickLngLat = useMapInspectorClickLngLat()
  const [lng, lat] = pointNearClick(geometry, clickLngLat)
  // 6 digits are about 10 cm; more only makes the links longer.
  const lngLat: [number, number] = [Number(lng.toFixed(6)), Number(lat.toFixed(6))]
  const openers = getLocationOpenersAt(lngLat).filter((opener) =>
    imageryOpenerIds.includes(opener.id),
  )

  const target: OpenTarget = {
    lngLat,
    zoom: mapParam.zoom,
    dateFrom: format(subYears(new Date(), imageryMaxAgeYears), 'yyyy-MM-dd'),
  }

  return openers.map((opener) => (
    <ToolsLinkImagery key={opener.id} opener={opener} target={target} />
  ))
}

type LinkProps = {
  opener: LocationOpener
  target: OpenTarget
}

const ToolsLinkImagery = ({ opener, target }: LinkProps) => {
  // Some services can open the nearest photo, turned to the place. That link needs a request, so
  // we fetch it when the user reaches for the button; until it is there the plain link opens.
  const [wanted, setWanted] = useState(false)
  // Kept until the page is left, and shared by clicks within about 10 m (4 digits), so going back
  // to a segment does not ask again.
  const lookAtTarget: OpenTarget = {
    ...target,
    lngLat: [Number(target.lngLat[0].toFixed(4)), Number(target.lngLat[1].toFixed(4))],
  }
  const { data: lookAtUrl, isFetching } = useQuery({
    queryKey: ['imageryLookAtUrl', opener.id, lookAtTarget.lngLat, lookAtTarget.dateFrom],
    queryFn: ({ signal }) => opener.lookAtUrl?.(lookAtTarget, signal) ?? null,
    enabled: wanted && Boolean(opener.lookAtUrl),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    retry: false,
  })
  const want = () => setWanted(true)

  return (
    <Link
      blank
      button
      href={lookAtUrl ?? opener.locationUrl(target)}
      onPointerEnter={want}
      onFocus={want}
      onTouchStart={want}
      title={opener.requiresAccount ? 'Nur mit eigenem Zugang nutzbar' : undefined}
      className="relative gap-1"
    >
      <span className={isFetching ? 'opacity-30' : undefined}>{opener.label}</span>
      {opener.requiresAccount && <LockClosedIcon className="size-3.5 text-gray-600" />}
      {/* On top of the label, so the button keeps its size. */}
      {isFetching && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size="5" screenReaderLabel={false} />
        </span>
      )}
    </Link>
  )
}
