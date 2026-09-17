import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { isBefore, subDays } from 'date-fns'
import { twMerge } from 'tailwind-merge'
import { useRegionLoaderData } from '@/components/regionen/pageRegionSlug/hooks/useRegionLoaderData'
import { RegionMembershipCallout } from '@/components/regionen/pageRegionSlug/RegionMembershipCallout'
import { IconModal } from '@/components/shared/Modal/IconModal'
import { Quote } from '@/components/shared/text/Quotes'
import { processingMetadataQueryOptions } from '@/server/regions/processingMetadataQueryOptions'
import { ControlButtonDot } from '../ControlButtonDot'
import {
  mapControlIconClassName,
  mobileMapIconButtonClassName,
} from '../mobile/mobileControlButton.const'
import { DownloadModalDatasetSections } from './DownloadModalDownloadList'
import { DownloadModalUpdateDate } from './DownloadModalUpdateDate'
import type { RegionModalAccess } from './regionModalAccess'

// Square map-control button (matches the other floating controls); `relative` so the
// ControlButtonDot anchors to the button corner.

const DownloadModalTriggerIcon = () => {
  const { data: metadata } = useQuery(processingMetadataQueryOptions())

  // Show icon without indicator if no data yet and not processing
  if (!metadata?.osm_data_from && metadata?.status !== 'processing') {
    return <ArrowDownTrayIcon className={mapControlIconClassName} />
  }

  // For postprocessing and processed, osm_data_from should be available
  const osmDataDate = metadata.osm_data_from ? new Date(metadata.osm_data_from) : null
  const isDataOlderThanYesterday = osmDataDate
    ? isBefore(osmDataDate, subDays(new Date(), 1))
    : false
  const isProcessing = metadata.status === 'processing'

  return (
    <>
      <ArrowDownTrayIcon className={mapControlIconClassName} />
      {(isProcessing || isDataOlderThanYesterday) && (
        <ControlButtonDot
          srLabel="Neue Kartendaten verfügbar oder Daten werden verarbeitet."
          ping={isProcessing}
        />
      )}
    </>
  )
}

type Props = {
  modalAccess: RegionModalAccess
  hasPermissions: boolean
}

export const DownloadModal = ({ modalAccess, hasPermissions }: Props) => {
  const { region } = useRegionLoaderData()
  const downloadTriggerClassName = twMerge(mobileMapIconButtonClassName, 'relative')

  // If exports is null, show as info button with only processing info
  if (region.exports === null) {
    return (
      <section className="contents">
        <IconModal
          title="Daten-Informationen"
          titleIcon="info"
          triggerStyle={downloadTriggerClassName}
          triggerIcon={<DownloadModalTriggerIcon />}
        >
          <DownloadModalUpdateDate />
          <p className="mb-2.5 rounded bg-orange-100 p-2 text-sm">
            Hinweis: Der Export ist für diese Region <Quote>{region.fullName}</Quote> nicht
            eingerichtet.
          </p>
        </IconModal>
      </section>
    )
  }

  // Dataset lists (downloadable, other, vector tiles) when permitted; doc links in download
  // modal when regionModalAccess allows — otherwise the documentation button covers them.
  const showDatasetSections =
    modalAccess.docsLinksVisibleInDownloadModal || (hasPermissions && region.exports != null)

  return (
    <section className="contents">
      <IconModal
        title="Daten downloaden"
        titleIcon="download"
        triggerStyle={downloadTriggerClassName}
        triggerIcon={<DownloadModalTriggerIcon />}
      >
        {!hasPermissions && (
          <RegionMembershipCallout
            className="pt-5 pb-2.5"
            accessMessage="Die Daten stehen nur für Rechte-Inhaber zur Verfügung."
            memberContactSuffix=" um Zugriff zur Region und zum Download zu erhalten."
          />
        )}

        <DownloadModalUpdateDate />

        {showDatasetSections ? (
          <DownloadModalDatasetSections
            modalAccess={modalAccess}
            showVectorTiles={hasPermissions}
          />
        ) : null}
      </IconModal>
    </section>
  )
}
