import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { adminBulletedListClassName } from '@/components/admin/adminListClasses'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { ObjectDump } from '@/components/admin/ObjectDump'
import { createSourceKeyStaticDatasets } from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { Link } from '@/components/shared/links/Link'
import { linkStyles } from '@/components/shared/links/styles'
import { getStaticDatasetUrl } from '@/components/shared/utils/getStaticDatasetUrl'
import { MapRenderFormatEnum } from '@/prisma/generated/browser'
import type { MetaData } from '@/scripts/StaticDatasets/types'
import type { getUploadWithRegions } from '@/server/uploads/queries/getUploadWithRegions.server'
import { deleteUploadFn, deleteUploadRegionFn } from '@/server/uploads/uploads.functions'

type Upload = Awaited<ReturnType<typeof getUploadWithRegions>>

type Props = {
  upload: Upload
}

export function AdminUploadClient({ upload }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { mutate: deleteUploadRegionMutation } = useMutation({
    mutationFn: (input: { uploadSlug: string; regionSlug: string }) =>
      deleteUploadRegionFn({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploadWithRegions', upload.slug] })
    },
  })

  const { mutate: deleteUploadMutation } = useMutation({
    mutationFn: (input: { uploadSlug: string }) => deleteUploadFn({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploads'] })
      navigate({ to: '/admin/uploads' })
    },
  })

  const publicUrlForPreview = new URL(
    getStaticDatasetUrl(upload.slug, upload.mapRenderFormat || 'pmtiles'),
  )
  publicUrlForPreview.searchParams.set('apiKey', '_API_KEY_')
  const previewUrl = new URL('https://pmtiles.io/')
  previewUrl.searchParams.set('url', publicUrlForPreview.toString())

  const configs = upload.configs as unknown as MetaData['configs']
  type ConfigItem = MetaData['configs'][number]

  const handleDeleteRegion = (regionSlug: string) => {
    if (
      window.confirm(
        `Die Relation zwischen Upload "${upload.slug}" und Region "${regionSlug}" unwiderruflich löschen?`,
      )
    ) {
      deleteUploadRegionMutation({ uploadSlug: upload.slug, regionSlug })
    }
  }

  const handleDeleteUpload = () => {
    if (window.confirm(`Upload "${upload.slug}" unwiderruflich löschen?`)) {
      deleteUploadMutation({ uploadSlug: upload.slug })
    }
  }

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[
            { href: '/admin/uploads', name: 'Uploads' },
            { href: `/admin/uploads/${upload.slug}`, name: 'Upload' },
          ]}
        />
      </HeaderWrapper>

      <h1>{upload.slug}</h1>

      <div className="my-4">
        <h2>Regionen</h2>
        {upload.regions.length === 0 ? (
          <p>Keine Regionen zugeordnet</p>
        ) : (
          <ul className={adminBulletedListClassName}>
            {upload.regions.map((region) => (
              <li key={region.id}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link blank to="/regionen/$regionSlug" params={{ regionSlug: region.slug }}>
                      {region.slug}
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteRegion(region.slug)}
                    className={linkStyles}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="space-y-2">
        {upload.regions.map((region) => {
          return configs.map((config: ConfigItem) => {
            if (!config) return null
            const key = createSourceKeyStaticDatasets(upload.slug, config.subId)
            return (
              <Link
                blank
                key={[region.id, key].join('-')}
                href={`/regionen/${region.slug}?data=${key}&debugMap=true`}
                className="block"
              >
                Öffnen in Region {region.slug}, Ansicht {config.name}
              </Link>
            )
          })
        })}
      </p>

      <p>
        Render-Format: <code>{upload.mapRenderFormat}</code>
      </p>

      {upload.mapRenderFormat === MapRenderFormatEnum.geojson ? (
        <p>
          <b>TODO: add link to geojson viewer</b>
        </p>
      ) : (
        <p>
          Vorschau für Devs (<code>_API_KEY_</code> aus <code>.env</code>/Bitwarden für{' '}
          <code>{import.meta.env.VITE_APP_ENV}</code>)
          <textarea value={previewUrl.toString()} className="w-full text-sm" />
        </p>
      )}

      <p>
        Öffentliche URL:{' '}
        <code>{getStaticDatasetUrl(upload.slug, upload.mapRenderFormat || 'pmtiles')}</code>
      </p>
      <p>
        PMTiles URL: <code>{upload.pmtilesUrl}</code>
      </p>
      <p>
        GeoJSON URL: <code>{upload.geojsonUrl}</code>
      </p>

      {configs.map((config: ConfigItem) => {
        const { name, category } = config
        return (
          <div key={name}>
            <h2>
              Ansicht: {name} – Kategorie: {category || '–'}
            </h2>
            <ObjectDump open data={config} className="my-10" />
          </div>
        )
      })}
      <ObjectDump data={upload} className="my-10" />

      <div className="mt-8 border-t pt-4">
        <button type="button" onClick={handleDeleteUpload} className={linkStyles}>
          Upload löschen
        </button>
      </div>
    </>
  )
}
