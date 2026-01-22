'use client'
import { MetaData } from '@/scripts/StaticDatasets/types'
import { Link } from '@/src/app/_components/links/Link'
import { linkStyles } from '@/src/app/_components/links/styles'
import { getStaticDatasetUrl } from '@/src/app/_components/utils/getStaticDatasetUrl'
import { useSlug } from '@/src/app/_hooks/useSlug'
import { Breadcrumb } from '@/src/app/admin/_components/Breadcrumb'
import { HeaderWrapper } from '@/src/app/admin/_components/HeaderWrapper'
import { ObjectDump } from '@/src/app/admin/_components/ObjectDump'
import { createSourceKeyStaticDatasets } from '@/src/app/regionen/[regionSlug]/_components/utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import deleteUpload from '@/src/server/uploads/mutations/deleteUpload'
import deleteUploadRegion from '@/src/server/uploads/mutations/deleteUploadRegion'
import getUploadWithRegions from '@/src/server/uploads/queries/getUploadWithRegions'
import { useMutation, useQuery } from '@blitzjs/rpc'
import { MapRenderFormatEnum } from '@prisma/client'
import { Route } from 'next'
import { useRouter } from 'next/navigation'

export default function AdminUploadPage() {
  const slug = useSlug()
  const router = useRouter()
  const [upload] = useQuery(getUploadWithRegions, { slug: slug! }, { staleTime: Infinity })!
  const [deleteUploadRegionMutation] = useMutation(deleteUploadRegion)
  const [deleteUploadMutation] = useMutation(deleteUpload)

  const publicUrlForPreview = new URL(
    getStaticDatasetUrl(upload.slug, upload.mapRenderFormat || 'pmtiles'),
  )
  publicUrlForPreview.searchParams.set('apiKey', '_API_KEY_')
  const previewUrl = new URL('https://pmtiles.io/')
  previewUrl.searchParams.set('url', publicUrlForPreview.toString())

  // Overwrite TS
  const configs = upload.configs as unknown as MetaData['configs']

  const handleDeleteRegion = async (regionSlug: string) => {
    if (
      window.confirm(
        `Die Relation zwischen Upload "${upload.slug}" und Region "${regionSlug}" unwiderruflich löschen?`,
      )
    ) {
      try {
        await deleteUploadRegionMutation({ uploadSlug: upload.slug, regionSlug })
        router.refresh()
      } catch (error: any) {
        window.alert(error.toString())
        console.error(error)
      }
    }
  }

  const handleDeleteUpload = async () => {
    if (window.confirm(`Upload "${upload.slug}" unwiderruflich löschen?`)) {
      try {
        await deleteUploadMutation({ uploadSlug: upload.slug })
        router.push('/admin/uploads')
      } catch (error: any) {
        window.alert(error.toString())
        console.error(error)
      }
    }
  }

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

      <div className="my-4">
        <h2>Regionen</h2>
        {upload.regions.length === 0 ? (
          <p>Keine Regionen zugeordnet</p>
        ) : (
          <ul className="marker:text-gray-800">
            {upload.regions.map((region) => (
              <li key={region.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Link blank href={`/regionen/${region.slug}`}>
                    {region.slug}
                  </Link>
                </div>
                <button onClick={() => handleDeleteRegion(region.slug)} className={linkStyles}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

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

      <div className="mt-8 border-t pt-4">
        <button onClick={handleDeleteUpload} className={linkStyles}>
          Upload löschen
        </button>
      </div>
    </>
  )
}

AdminUploadPage.authenticate = { role: 'ADMIN' }
