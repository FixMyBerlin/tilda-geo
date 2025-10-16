import { LinkExternal } from '@/src/app/_components/links/LinkExternal'
import { mapillaryKeyUrl } from '../Tools/osmUrls/osmUrls'

type Props = {
  visible: boolean
  /** @desc Mapillary picture key */
  pKey: string | number
}

// Docs https://www.mapillary.com/developer/api-documentation?locale=de_DE#embed
export const MapillaryIframe = ({ visible, pKey }: Props) => {
  if (!visible) return null
  const link = mapillaryKeyUrl(pKey)
  if (!link) return null

  return (
    <section>
      <iframe
        title="Mapillary Image Preview"
        src={`https://www.mapillary.com/embed?image_key=${pKey}&style=photo`}
        className="aspect-square w-full"
      ></iframe>
      <div className="mt-2 flex justify-center">
        <LinkExternal href={link} button blank className="text-sm">
          In neuem Fenster öffnen
        </LinkExternal>
      </div>
    </section>
  )
}
