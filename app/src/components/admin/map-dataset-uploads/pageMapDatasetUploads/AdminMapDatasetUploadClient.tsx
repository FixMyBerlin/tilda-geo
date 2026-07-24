import { useMutation } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { AdminConsoleDumpButton } from '@/components/admin/AdminConsoleDumpButton'
import { adminBulletedListClassName } from '@/components/admin/adminListClasses'
import { AdminPageTitleView, AdminPageTitleViewLabel } from '@/components/admin/adminPageTitle'
import { AdminTrashIconButton } from '@/components/admin/AdminTrashIconButton'
import { AuditHistoryPanel } from '@/components/admin/audit-log/AuditHistoryPanel'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { createSourceKeyStaticDatasets } from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { Link } from '@/components/shared/links/Link'
import { toastError } from '@/components/shared/toast/toastError'
import { getStaticDatasetUrl } from '@/components/shared/utils/getStaticDatasetUrl'
import { MapRenderFormatEnum } from '@/prisma/generated/browser'
import type { AuditLogRow } from '@/server/audit/queries/listAuditLog.server'
import type { getUploadWithRegions } from '@/server/uploads/queries/getUploadWithRegions.server'
import { deleteUploadFn, deleteUploadRegionFn } from '@/server/uploads/uploads.functions'

type Upload = Awaited<ReturnType<typeof getUploadWithRegions>>

type Props = {
  upload: Upload
  auditHistory: AuditLogRow[]
}

export function AdminMapDatasetUploadClient({ upload, auditHistory }: Props) {
  const navigate = useNavigate()
  const router = useRouter()

  const { mutate: deleteUploadRegionMutation } = useMutation({
    mutationFn: (input: { uploadSlug: string; regionSlug: string }) =>
      deleteUploadRegionFn({ data: input }),
    // This page renders from the route loader, not a useQuery — invalidate the router so the
    // region list refetches and the removed row disappears (a queryClient invalidation would be a
    // no-op here).
    onSuccess: () => router.invalidate(),
    onError: (error) => toastError(error, 'Löschen fehlgeschlagen'),
  })

  const { mutate: deleteUploadMutation } = useMutation({
    mutationFn: (input: { uploadSlug: string }) => deleteUploadFn({ data: input }),
    onSuccess: () => navigate({ to: '/admin/map-dataset-uploads' }),
    onError: (error) => toastError(error, 'Löschen fehlgeschlagen'),
  })

  const publicUrlForPreview = new URL(
    getStaticDatasetUrl(upload.slug, upload.mapRenderFormat || 'pmtiles'),
  )
  publicUrlForPreview.searchParams.set('apiKey', '_API_KEY_')
  const previewUrl = new URL('https://pmtiles.io/')
  previewUrl.searchParams.set('url', publicUrlForPreview.toString())

  const layerConfigs = upload.layerConfigs

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
            { href: '/admin/map-dataset-uploads', name: 'Uploads' },
            {
              href: `/admin/map-dataset-uploads/${upload.slug}`,
              name: <AdminPageTitleViewLabel name={upload.slug} variant="breadcrumb" />,
            },
          ]}
        />
      </HeaderWrapper>

      <div className="flex items-center gap-2">
        <AdminPageTitleView name={upload.slug} />
        <AdminConsoleDumpButton name={upload.slug} data={upload} />
      </div>

      <section className="my-4">
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
                  <AdminTrashIconButton
                    ariaLabel={`Zuordnung zu Region ${region.slug} entfernen`}
                    onClick={() => handleDeleteRegion(region.slug)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="space-y-2">
        {upload.regions.map((region) => {
          return layerConfigs.map((layerConfig) => {
            const key = createSourceKeyStaticDatasets(upload.slug, layerConfig.subId ?? undefined)
            return (
              <Link
                blank
                key={[region.id, key].join('-')}
                href={`/regionen/${region.slug}?data=${key}&debugMap=true`}
                className="block"
              >
                Öffnen in Region {region.slug}, Ansicht {layerConfig.name}
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
          <textarea readOnly value={previewUrl.toString()} className="w-full text-sm" />
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

      {layerConfigs.map((layerConfig) => {
        const { name, categoryKey } = layerConfig
        return (
          <div key={layerConfig.id} className="my-10">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="m-0">
                Ansicht: {name} – Kategorie: {categoryKey || '–'}
              </h2>
              <AdminConsoleDumpButton name={name} data={layerConfig} />
            </div>
          </div>
        )
      })}
      <AuditHistoryPanel
        rows={auditHistory}
        model="MapDatasetUpload"
        recordId={String(upload.id)}
      />

      <div className="mt-8 flex justify-end border-t pt-4">
        <AdminTrashIconButton
          ariaLabel={`Upload ${upload.slug} löschen`}
          size="comfortable"
          onClick={handleDeleteUpload}
        />
      </div>
    </>
  )
}
