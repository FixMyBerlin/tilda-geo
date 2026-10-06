import {
  ArrowTopRightOnSquareIcon as ArrowTopRightOnSquareIconOutline,
  EyeIcon as EyeIconOutline,
  EyeSlashIcon as EyeSlashIconOutline,
} from '@heroicons/react/24/outline'
import { twJoin } from 'tailwind-merge'
import z from 'zod'
import { Link } from '@/components/shared/links/Link'
import { mapillaryKeyUrl } from '@/lib/mapillaryPKeyUrl'
import { useStreetImageryParam } from '../../../streetImagery/useStreetImageryParam'
import {
  tagsTableLabelCellClass,
  tagsTableRowClass,
  tagsTableValueCellClass,
} from '../tagsTableLayout'
import { ConditionalFormattedKey } from '../translations/ConditionalFormattedKey'
import type { CompositTableRow } from './types'

const mapillarySchema = z
  .string()
  .transform((val) => {
    if (val.includes(';')) {
      return val
        .split(';')
        .map((item) => item.trim())
        .filter(Boolean)
    }
    return [val.trim()]
  })
  .or(z.undefined())

export const tableKeyMapillary = 'composit_mapillary'

/**
 * Mapillary photos an OSM object is tagged with (`mapillary=*`, `mapillary:forward=*` …). The eye
 * opens a photo in the street imagery viewer over the map; it works without the Mapillary layer.
 */
export const TagsTableRowCompositMapillary = ({ sourceId, properties }: CompositTableRow) => {
  const { photo: shownPhoto, setPhoto } = useStreetImageryParam()
  const groups = [
    { label: 'Standard', keys: mapillarySchema.parse(properties.mapillary) || [] },
    { label: 'Fahrtrichtung', keys: mapillarySchema.parse(properties.mapillary_forward) || [] },
    { label: 'Gegenrichtung', keys: mapillarySchema.parse(properties.mapillary_backward) || [] },
    {
      label: 'Verkehrszeichen',
      keys: mapillarySchema.parse(properties.mapillary_traffic_sign) || [],
    },
  ].filter((group) => group.keys.length > 0)

  if (groups.length === 0) return null

  const isShown = (key: string) => shownPhoto?.provider === 'mapillary' && shownPhoto.id === key

  return (
    <tr className={tagsTableRowClass}>
      <td className={twJoin(tagsTableLabelCellClass, 'text-gray-900')}>
        <ConditionalFormattedKey sourceId={sourceId} tagKey="mapillary" />
      </td>
      <td className={twJoin(tagsTableValueCellClass, 'text-gray-500')}>
        <ul className="space-y-1">
          {groups.flatMap(({ label, keys }) =>
            keys.map((key, index) => (
              <li key={`${label}-${key}`} className="flex items-center justify-between">
                <button
                  type="button"
                  className="group flex cursor-pointer items-center gap-1.5 hover:text-gray-900"
                  onClick={() =>
                    setPhoto(isShown(key) ? undefined : { provider: 'mapillary', id: key })
                  }
                  aria-pressed={isShown(key)}
                  title={isShown(key) ? 'Foto schließen' : 'Foto über der Karte zeigen'}
                >
                  <OpenCloseIcon open={isShown(key)} />
                  <span>
                    {label} {keys.length > 1 ? index + 1 : ''}
                  </span>
                </button>
                <MapillaryNewWindowLink pKey={key} />
              </li>
            )),
          )}
        </ul>
      </td>
    </tr>
  )
}

function OpenCloseIcon({ open }: { open: boolean }) {
  if (open) {
    return <EyeSlashIconOutline className="h-4 w-4" data-testid="eye-closed" />
  }
  return <EyeIconOutline className="h-4 w-4" data-testid="eye-open" />
}

function MapillaryNewWindowLink({ pKey }: { pKey: string }) {
  const link = mapillaryKeyUrl(pKey)
  if (!link) return null
  return (
    <Link blank href={link}>
      <ArrowTopRightOnSquareIconOutline className="hover h-4 w-4" />
    </Link>
  )
}
