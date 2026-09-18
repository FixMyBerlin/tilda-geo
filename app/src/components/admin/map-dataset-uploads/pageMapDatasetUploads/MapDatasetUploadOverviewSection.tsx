import {
  AdminDescriptionList,
  type AdminDescriptionListItem,
} from '@/components/admin/AdminDescriptionList'
import { AdminFormSection } from '@/components/admin/aside/AdminFormSection'
import { Link } from '@/components/shared/links/Link'
import { Pill } from '@/components/shared/text/Pill'
import { getStaticDatasetUrl } from '@/components/shared/utils/getStaticDatasetUrl'
import { MapRenderFormatEnum } from '@/prisma/generated/browser'
import type { getUploadWithRegions } from '@/server/uploads/queries/getUploadWithRegions.server'

type Upload = Awaited<ReturnType<typeof getUploadWithRegions>>

type Props = {
  id: string
  title: string
  upload: Upload
}

/** „Übersicht“ — core facts about the upload; raw JSON stays in `AdminTechnicalDetails`. */
export const MapDatasetUploadOverviewSection = ({ id, title, upload }: Props) => {
  const publicUrl = getStaticDatasetUrl(upload.slug, upload.mapRenderFormat || 'pmtiles')
  const isGeojson = upload.mapRenderFormat === MapRenderFormatEnum.geojson

  const previewHref = (() => {
    if (isGeojson) return undefined
    const publicUrlForPreview = new URL(publicUrl)
    publicUrlForPreview.searchParams.set('apiKey', '_API_KEY_')
    const previewUrl = new URL('https://pmtiles.io/')
    previewUrl.searchParams.set('url', publicUrlForPreview.toString())
    return previewUrl.toString()
  })()

  const items: (AdminDescriptionListItem | null)[] = [
    { label: 'Slug', value: <code>{upload.slug}</code> },
    {
      label: 'Zugriff',
      value: upload.public ? <Pill color="purple">Public</Pill> : <Pill color="green">Login</Pill>,
    },
    { label: 'Art', value: upload.systemLayer ? <Pill color="gray">System</Pill> : 'Daten' },
    { label: 'Render-Format', value: <code>{upload.mapRenderFormat}</code> },
    { label: 'Öffentliche URL', value: <code className="break-all">{publicUrl}</code> },
    upload.pmtilesUrl
      ? { label: 'PMTiles-URL', value: <code className="break-all">{upload.pmtilesUrl}</code> }
      : null,
    upload.geojsonUrl
      ? { label: 'GeoJSON-URL', value: <code className="break-all">{upload.geojsonUrl}</code> }
      : null,
    {
      label: 'GitHub-Quelle',
      value: upload.githubUrl ? (
        <Link blank href={upload.githubUrl} className="break-all">
          {upload.githubUrl}
        </Link>
      ) : (
        ''
      ),
    },
    upload.licence ? { label: 'Lizenz', value: upload.licence } : null,
    upload.dataUpdatedNote ? { label: 'Daten-Stand', value: upload.dataUpdatedNote } : null,
    previewHref
      ? {
          label: 'PMTiles-Vorschau',
          value: (
            <div className="space-y-1">
              <Link blank href={previewHref}>
                pmtiles.io öffnen
              </Link>
              <p className="text-xs text-gray-500">
                API-Key <code>_API_KEY_</code> im Link durch den Key aus <code>.env</code>/Bitwarden
                für <code>{import.meta.env.VITE_APP_ENV}</code> ersetzen.
              </p>
            </div>
          ),
        }
      : null,
  ]

  return (
    <AdminFormSection id={id} title={title}>
      <AdminDescriptionList
        items={items.filter((item): item is AdminDescriptionListItem => Boolean(item))}
      />
    </AdminFormSection>
  )
}
