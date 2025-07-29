import { LinkExternal } from '@/src/app/_components/links/LinkExternal'
import {
  ArrowTopRightOnSquareIcon as ArrowTopRightOnSquareIconOutline,
  EyeIcon as EyeIconOutline,
  EyeSlashIcon as EyeSlashIconOutline,
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import z from 'zod'
import { MapillaryIframe } from '../../MapillaryIframe/MapillaryIframe'
import { mapillaryKeyUrl } from '../../Tools/osmUrls/osmUrls'
import { ConditionalFormattedKey } from '../translations/ConditionalFormattedKey'
import { CompositTableRow } from './types'

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
export const TagsTableRowCompositMapillary = ({
  sourceId,
  tagKey,
  properties,
}: CompositTableRow) => {
  const keyDefaults = mapillarySchema.parse(properties.mapillary) || []
  const keyForwards = mapillarySchema.parse(properties.mapillary_forward) || []
  const keyBackwards = mapillarySchema.parse(properties.mapillary_backward) || []
  const keyTrafficSigns = mapillarySchema.parse(properties.mapillary_traffic_sign) || []

  const [openDefault, setOpenDefault] = useState(false)
  const [openForward, setOpenForward] = useState(false)
  const [openBackward, setOpenBackward] = useState(false)
  const [openTrafficSign, setOpenTrafficSign] = useState(false)

  if (
    !keyDefaults.length &&
    !keyForwards.length &&
    !keyBackwards.length &&
    !keyTrafficSigns.length
  ) {
    return null
  }

  // Return table is a manual version of <TagsTableRow>
  // which we copied here to allow for colspan=2 for the images
  return (
    <>
      <tr className="group">
        <td className="w-2/5 py-2 pl-4 pr-3 text-sm font-medium text-gray-900">
          <ConditionalFormattedKey sourceId={sourceId} tagKey={tagKey} />
        </td>
        <td className="px-3 py-2 text-sm text-gray-500">
          <ul className="space-y-1">
            {keyDefaults.length > 0 && (
              <li className="flex items-center justify-between">
                <button
                  type="button"
                  className="group flex items-center gap-1.5"
                  onClick={() => setOpenDefault((v) => !v)}
                  aria-pressed={openDefault}
                >
                  <OpenCloseIcon open={openDefault} />
                  <span>Standard {keyDefaults.length > 1 ? `(${keyDefaults.length})` : ''}</span>
                </button>
                <div className="flex gap-1">
                  {keyDefaults.map((key) => (
                    <MapillaryNewWindowLink key={key} pKey={key} />
                  ))}
                </div>
              </li>
            )}
            {keyForwards.length > 0 && (
              <li className="flex items-center justify-between">
                <button
                  type="button"
                  className="group flex items-center gap-1.5"
                  onClick={() => setOpenForward((v) => !v)}
                  aria-pressed={openForward}
                >
                  <OpenCloseIcon open={openForward} />
                  <span>
                    Fahrtrichtung {keyForwards.length > 1 ? `(${keyForwards.length})` : ''}
                  </span>
                </button>
                <div className="flex gap-1">
                  {keyForwards.map((key) => (
                    <MapillaryNewWindowLink key={key} pKey={key} />
                  ))}
                </div>
              </li>
            )}
            {keyBackwards.length > 0 && (
              <li className="flex items-center justify-between">
                <button
                  type="button"
                  className="group flex items-center gap-1.5"
                  onClick={() => setOpenBackward((v) => !v)}
                  aria-pressed={openBackward}
                >
                  <OpenCloseIcon open={openBackward} />
                  <span>
                    Gegenrichtung {keyBackwards.length > 1 ? `(${keyBackwards.length})` : ''}
                  </span>
                </button>
                <div className="flex gap-1">
                  {keyBackwards.map((key) => (
                    <MapillaryNewWindowLink key={key} pKey={key} />
                  ))}
                </div>
              </li>
            )}
            {keyTrafficSigns.length > 0 && (
              <li className="flex items-center justify-between">
                <button
                  type="button"
                  className="group flex items-center gap-1.5"
                  onClick={() => setOpenTrafficSign((v) => !v)}
                  aria-pressed={openTrafficSign}
                >
                  <OpenCloseIcon open={openTrafficSign} />
                  <span>
                    Verkehrszeichen{' '}
                    {keyTrafficSigns.length > 1 ? `(${keyTrafficSigns.length})` : ''}
                  </span>
                </button>
                <div className="flex gap-1">
                  {keyTrafficSigns.map((key) => (
                    <MapillaryNewWindowLink key={key} pKey={key} />
                  ))}
                </div>
              </li>
            )}
          </ul>
        </td>
      </tr>

      {openDefault && keyDefaults.length > 0 && (
        <>
          {keyDefaults.map((key) => (
            <tr key={`default-${key}`}>
              <td colSpan={2} className="bg-gray-200">
                <MapillaryIframe visible={openDefault} pKey={key} />
              </td>
            </tr>
          ))}
        </>
      )}
      {openForward && keyForwards.length > 0 && (
        <>
          {keyForwards.map((key) => (
            <tr key={`forward-${key}`}>
              <td colSpan={2} className="bg-gray-200">
                <MapillaryIframe visible={openForward} pKey={key} />
              </td>
            </tr>
          ))}
        </>
      )}
      {openBackward && keyBackwards.length > 0 && (
        <>
          {keyBackwards.map((key) => (
            <tr key={`backward-${key}`}>
              <td colSpan={2} className="bg-gray-200">
                <MapillaryIframe visible={openBackward} pKey={key} />
              </td>
            </tr>
          ))}
        </>
      )}
      {openTrafficSign && keyTrafficSigns.length > 0 && (
        <>
          {keyTrafficSigns.map((key) => (
            <tr key={`traffic-sign-${key}`}>
              <td colSpan={2} className="bg-gray-200">
                <MapillaryIframe visible={openTrafficSign} pKey={key} />
              </td>
            </tr>
          ))}
        </>
      )}
    </>
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
    <LinkExternal blank href={link}>
      <ArrowTopRightOnSquareIconOutline className="hover h-4 w-4" />
    </LinkExternal>
  )
}
