import { IconModal } from '@/src/app/_components/Modal/IconModal'
import { Link } from '@/src/app/_components/links/Link'
import { linkStyles } from '@/src/app/_components/links/styles'
import { useHasPermissions } from '@/src/app/_hooks/useHasPermissions'
import { useStartUserLogin } from '@/src/app/_hooks/useStartUserLogin'
import getAtlasGeoMetadata from '@/src/server/regions/queries/getAtlasGeoMetadata'
import { useSession } from '@blitzjs/auth'
import { useQuery } from '@blitzjs/rpc'
import { ArrowDownTrayIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { isBefore, subDays } from 'date-fns'
import { Suspense } from 'react'
import { useRegion } from '../regionUtils/useRegion'
import { DownloadModalDownloadListWithVectorTiles } from './DownloadModalDownloadList'
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
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-orange-500" />
      )}
    </div>
  )
}

export const DownloadModal = () => {
  const region = useRegion()
  const hasPermissions = useHasPermissions()
  const isLoggedIn = Boolean(useSession()?.role)
  const handleLogin = useStartUserLogin()

  // If exports is null, show as info button with only processing info
  if (region.exports === null) {
    return (
      <section>
        <IconModal
          title="Daten-Informationen"
          titleIcon="info"
          triggerStyle="button"
          triggerIcon={
            <Suspense fallback={<InformationCircleIcon className="size-5" />}>
              <DownloadModalTriggerIcon />
            </Suspense>
          }
        >
          <DownloadModalUpdateDate />
          <p className="mb-2.5 rounded bg-orange-100 p-2 text-sm">
            Hinweis: Der Export ist für diese Region {region.fullName} nicht eingerichtet.
          </p>
        </IconModal>
      </section>
    )
  }

  return (
    <section>
      <IconModal
        title="Daten downloaden"
        titleIcon="download"
        triggerStyle="button"
        triggerIcon={
          <Suspense fallback={<ArrowDownTrayIcon className="size-5" />}>
            <DownloadModalTriggerIcon />
          </Suspense>
        }
      >
        {!hasPermissions && (
          <>
            <p className="pt-5 pb-2.5 text-sm">
              Die Daten stehen nur für Rechte-Inhaber zur Verfügung.
            </p>
            {isLoggedIn ? (
              <p className="pt-5 pb-2.5 text-sm">
                Bitte <Link href="/kontakt">kontaktieren Sie uns</Link> um Zugriff zur Region und
                zum Download zu erhalten.
              </p>
            ) : (
              <p className="pt-5 pb-2.5 text-sm">
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

        {hasPermissions && <DownloadModalDownloadListWithVectorTiles />}
      </IconModal>
    </section>
  )
}
