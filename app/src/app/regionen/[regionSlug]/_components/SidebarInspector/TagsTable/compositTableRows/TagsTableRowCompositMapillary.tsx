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

const mapillarySchema = z.string().or(z.undefined())

export const tableKeyMapillary = 'composit_mapillary'
export const TagsTableRowCompositMapillary = ({
  sourceId,
  tagKey,
  properties,
}: CompositTableRow) => {
  const keyDefault = mapillarySchema.parse(properties.mapillary)
  const keyForward = mapillarySchema.parse(properties.mapillary_forward)
  const keyBackward = mapillarySchema.parse(properties.mapillary_backward)
  const keyTrafficSign = mapillarySchema.parse(properties.mapillary_traffic_sign)

  const [openDefault, setOpenDefault] = useState(false)
  const [openForward, setOpenForward] = useState(false)
  const [openBackward, setOpenBackward] = useState(false)
  const [openTrafficSign, setOpenTrafficSign] = useState(false)

  if (!keyDefault && !keyForward && !keyBackward && !keyTrafficSign) return null

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
            {keyDefault && (
              <li className="flex items-center justify-between">
                <button
                  type="button"
                  className="group flex items-center gap-1.5"
                  onClick={() => setOpenDefault((v) => !v)}
                  aria-pressed={openDefault}
                >
                  <OpenCloseIcon open={openDefault} />
                  <span>Standard</span>
                </button>
                <MapillaryNewWindowLink pKey={keyDefault} />
              </li>
            )}
            {keyForward && (
              <li className="flex items-center justify-between">
                <button
                  type="button"
                  className="group flex items-center gap-1.5"
                  onClick={() => setOpenForward((v) => !v)}
                  aria-pressed={openForward}
                >
                  <OpenCloseIcon open={openForward} />
                  <span>Fahrtrichtung</span>
                </button>
                <MapillaryNewWindowLink pKey={keyForward} />
              </li>
            )}
            {keyBackward && (
              <li className="flex items-center justify-between">
                <button
                  type="button"
                  className="group flex items-center gap-1.5"
                  onClick={() => setOpenBackward((v) => !v)}
                  aria-pressed={openBackward}
                >
                  <OpenCloseIcon open={openBackward} />
                  <span>Gegenrichtung</span>
                </button>
                <MapillaryNewWindowLink pKey={keyBackward} />
              </li>
            )}
            {keyTrafficSign && (
              <li className="flex items-center justify-between">
                <button
                  type="button"
                  className="group flex items-center gap-1.5"
                  onClick={() => setOpenTrafficSign((v) => !v)}
                  aria-pressed={openTrafficSign}
                >
                  <OpenCloseIcon open={openTrafficSign} />
                  <span>Verkehrszeichen</span>
                </button>
                <MapillaryNewWindowLink pKey={keyTrafficSign} />
              </li>
            )}
          </ul>
        </td>
      </tr>

      {openDefault && keyDefault && (
        <tr>
          <td colSpan={2} className="bg-gray-200">
            <MapillaryIframe visible={openDefault} pKey={keyDefault} />
          </td>
        </tr>
      )}
      {openForward && keyForward && (
        <tr>
          <td colSpan={2} className="bg-gray-200">
            <MapillaryIframe visible={openForward} pKey={keyForward} />
          </td>
        </tr>
      )}
      {openBackward && keyBackward && (
        <tr>
          <td colSpan={2} className="bg-gray-200">
            <MapillaryIframe visible={openBackward} pKey={keyBackward} />
          </td>
        </tr>
      )}
      {openTrafficSign && keyTrafficSign && (
        <tr>
          <td colSpan={2} className="bg-gray-200">
            <MapillaryIframe visible={openTrafficSign} pKey={keyTrafficSign} />
          </td>
        </tr>
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
