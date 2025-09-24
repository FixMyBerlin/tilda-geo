'use client'
import { MetaData } from '@/scripts/StaticDatasets/types'
import { Link } from '@/src/app/_components/links/Link'
import { getStaticDatasetUrl } from '@/src/app/_components/utils/getStaticDatasetUrl'
import { useSlug } from '@/src/app/_hooks/useSlug'
import { MapRenderFormatEnum } from '@prisma/client'
import { Breadcrumb } from '@/src/app/admin/_components/Breadcrumb'
import { HeaderWrapper } from '@/src/app/admin/_components/HeaderWrapper'
import { ObjectDump } from '@/src/app/admin/_components/ObjectDump'
import { createSourceKeyStaticDatasets } from '@/src/app/regionen/[regionSlug]/_components/utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import getUploadWithRegions from '@/src/server/uploads/queries/getUploadWithRegions'
import { useQuery } from '@blitzjs/rpc'
import { Route } from 'next'

export default function AdminUploadPage() {
  const slug = useSlug()
  const [upload] = useQuery(getUploadWithRegions, { slug: slug! }, { staleTime: Infinity })!

  const publicUrlForPreview = new URL(
    getStaticDatasetUrl(upload.slug, upload.mapRenderFormat || 'pmtiles'),
  )
  publicUrlForPreview.searchParams.set('apiKey', '_API_KEY_')
  const previewUrl = new URL('https://pmtiles.io/')
  previewUrl.searchParams.set('url', publicUrlForPreview.toString())

  // Overwrite TS
  const configs = upload.configs as unknown as MetaData['configs']

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[
            { href: '/admin/uploads', name: 'Uploads' },
            { href: `/admin/uploads/${slug}` as Route, name: 'Upload' },
          ]}
        />
      </HeaderWrapper>

      <h1>{upload.slug}</h1>

      <p className="space-y-2">
        {upload.regions.map((region) => {
          return configs.map((config) => {
            if (!config) return null
            const key = createSourceKeyStaticDatasets(upload.slug, config?.subId)
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
          <code>{process.env.NEXT_PUBLIC_APP_ENV}</code>)
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

      {configs.map((config) => {
        const { name, category } = config as any as MetaData['configs'][number]
        return (
          <div key={name}>
            <h2>
              Ansicht: {name} – Kategorie: {category || '–'}
            </h2>
            <ObjectDump open data={config} className="my-10" />
          </div>
        )
      })}
      <ObjectDump data={upload!} className="my-10" />
    </>
  )
}

AdminUploadPage.authenticate = { role: 'ADMIN' }
