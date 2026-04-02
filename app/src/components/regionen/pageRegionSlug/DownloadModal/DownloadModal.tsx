import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { isBefore, subDays } from 'date-fns'
import { useRegionLoaderData } from '@/components/regionen/pageRegionSlug/hooks/useRegionLoaderData'
import { authClient } from '@/components/shared/auth/auth-client'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { useSignInUrl } from '@/components/shared/hooks/useSignInUrl'
import { Link } from '@/components/shared/links/Link'
import { linkStyles } from '@/components/shared/links/styles'
import { IconModal } from '@/components/shared/Modal/IconModal'
import { processingMetadataQueryOptions } from '@/server/regions/processingMetadataQueryOptions'
import { DownloadModalDownloadListWithVectorTiles } from './DownloadModalDownloadList'
import { DownloadModalUpdateDate } from './DownloadModalUpdateDate'

const DownloadModalTriggerIcon = () => {
  const { data: metadata } = useQuery(processingMetadataQueryOptions())

  // Show icon without indicator if no data yet and not processing
  if (!metadata?.osm_data_from && metadata?.status !== 'processing') {
    return <ArrowDownTrayIcon className="size-5" />
  }

  // For postprocessing and processed, osm_data_from should be available
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
  const { region } = useRegionLoaderData()
  const hasPermissions = useHasPermissions()
  const { data: session } = authClient.useSession()
  const isLoggedIn = Boolean(session?.role)
  const signInHref = useSignInUrl()

  // If exports is null, show as info button with only processing info
  if (region.exports === null) {
    return (
      <section>
        <IconModal
          title="Daten-Informationen"
          titleIcon="info"
          triggerStyle="button"
          triggerIcon={<DownloadModalTriggerIcon />}
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
        triggerIcon={<DownloadModalTriggerIcon />}
      >
        {!hasPermissions && (
          <>
            <p className="pt-5 pb-2.5 text-sm">
              Die Daten stehen nur für Rechte-Inhaber zur Verfügung.
            </p>
            {isLoggedIn ? (
              <p className="pt-5 pb-2.5 text-sm">
                Bitte <Link to="/kontakt">kontaktieren Sie uns</Link> um Zugriff zur Region und zum
                Download zu erhalten.
              </p>
            ) : (
              <p className="pt-5 pb-2.5 text-sm">
                Bitte{' '}
                <Link href={signInHref} className={linkStyles}>
                  loggen Sie sich ein
                </Link>
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
