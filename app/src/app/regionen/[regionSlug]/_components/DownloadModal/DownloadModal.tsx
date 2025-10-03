import { IconModal } from '@/src/app/_components/Modal/IconModal'
import { Link } from '@/src/app/_components/links/Link'
import { linkStyles } from '@/src/app/_components/links/styles'
import { useHasPermissions } from '@/src/app/_hooks/useHasPermissions'
import { useStartUserLogin } from '@/src/app/_hooks/useStartUserLogin'
import getAtlasGeoMetadata from '@/src/server/regions/queries/getAtlasGeoMetadata'
import { useSession } from '@blitzjs/auth'
import { useQuery } from '@blitzjs/rpc'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { isBefore, subDays } from 'date-fns'
import { Suspense } from 'react'
import { useRegion } from '../regionUtils/useRegion'
import { DownloadModalDownloadList } from './DownloadModalDownloadList'
import { DownloadModalUpdateDate } from './DownloadModalUpdateDate'

const DownloadModalTriggerIcon = () => {
  const [metadata] = useQuery(getAtlasGeoMetadata, {})

  if (!metadata?.osm_data_from && metadata?.status !== 'processing') {
    return <ArrowDownTrayIcon className="size-5" />
  }

  const osmDataDate = metadata.osm_data_from ? new Date(metadata.osm_data_from) : null
  const isDataOlderThanYesterday = osmDataDate
    ? isBefore(osmDataDate, subDays(new Date(), 1))
    : false
  const isProcessing = metadata.status === 'processing'

  return (
    <div className="relative">
      <ArrowDownTrayIcon className="size-5" />
      {(isProcessing || isDataOlderThanYesterday) && (
        <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-orange-500" />
      )}
    </div>
  )
}

export const DownloadModal = () => {
  const region = useRegion()
  const bboxDefined = region?.bbox ? true : false

  const hasPermissions = useHasPermissions()
  const canDownload = region.exportPublic ? true : hasPermissions
  const isLoggedIn = Boolean(useSession()?.role)

  const handleLogin = useStartUserLogin()

  if (region.hideDownload === true) return null

  return (
    <section>
      <IconModal
        title="Daten downloaden"
        titleIcon="download"
        triggerStyle="button"
        triggerIcon={
          <Suspense fallback={<ArrowDownTrayIcon className="h-5 w-5" />}>
            <DownloadModalTriggerIcon />
          </Suspense>
        }
      >
        {!canDownload && (
          <>
            <p className="pb-2.5 pt-5 text-sm">
              Die Daten stehen nur für Rechte-Inhaber zur Verfügung.
            </p>
            {isLoggedIn ? (
              <p className="pb-2.5 pt-5 text-sm">
                Bitte <Link href="/kontakt">kontaktieren Sie uns</Link> um Zugriff zur Region und
                zum Download zu erhalten.
              </p>
            ) : (
              <p className="pb-2.5 pt-5 text-sm">
                Bitte{' '}
                <button className={linkStyles} onClick={handleLogin}>
                  loggen Sie sich ein
                </button>
                .
              </p>
            )}
          </>
        )}

        <DownloadModalUpdateDate />

        {canDownload && bboxDefined && <DownloadModalDownloadList />}

        {canDownload && !bboxDefined && (
          <p className="mb-2.5 rounded bg-orange-100 p-2 text-sm">
            Hinweis: Der Export ist für diese Region {region.fullName} nicht eingerichtet.
          </p>
        )}
      </IconModal>
    </section>
  )
}
