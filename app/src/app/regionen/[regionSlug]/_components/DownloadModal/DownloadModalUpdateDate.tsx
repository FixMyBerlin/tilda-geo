import { SmallSpinner } from '@/src/app/_components/Spinner/SmallSpinner'
import getAtlasGeoMetadata from '@/src/server/regions/queries/getAtlasGeoMetadata'
import { useQuery } from '@blitzjs/rpc'
import { format, isBefore, subDays } from 'date-fns'
import { de } from 'date-fns/locale'
import { Suspense } from 'react'

export const DownloadModalUpdateDate = () => {
  return (
    <div className="pb-5">
      <Suspense fallback={<SmallSpinner />}>
        <DownloadModalUpdateDateContent />
      </Suspense>
    </div>
  )
}

const DownloadModalUpdateDateContent = () => {
  const [metadata] = useQuery(getAtlasGeoMetadata, {})

  if (!metadata?.status) return null

  if (metadata.status === 'processing') {
    return (
      <p className="mt-4 rounded bg-orange-100 p-2 text-sm">
        Aktuell werden die Daten erneuert. In dieser Zeit können unvollständige Daten angezeigt
        werden. Der Prozess wurde am{' '}
        {format(new Date(metadata.processing_started_at!), 'dd.MM.yyyy HH:mm', { locale: de })}{' '}
        gestartet und dauert für gewöhnlich ca. 2 Stunden.
      </p>
    )
  }

  const osmDataDate = new Date(metadata.osm_data_from)
  const isDataOlderThanYesterday = isBefore(osmDataDate, subDays(new Date(), 1))

  return (
    <details className="mt-4">
      <summary className="cursor-pointer text-sm hover:underline">
        <span className={isDataOlderThanYesterday ? 'text-orange-600' : ''}>
          Letzte Aktualisierung der Daten: {format(osmDataDate, 'dd.MM.yyyy', { locale: de })}{' '}
          <span className="text-gray-400">{format(osmDataDate, 'HH:mm', { locale: de })}</span>
        </span>
      </summary>
      <div className="mt-2 text-sm text-gray-600">
        <p>
          Verarbeitung gestartet:{' '}
          {metadata.processing_started_at
            ? format(new Date(metadata.processing_started_at), 'dd.MM.yyyy HH:mm', { locale: de })
            : 'Unbekannt'}
        </p>
        <p>
          Verarbeitung abgeschlossen:{' '}
          {metadata.processed_at
            ? format(new Date(metadata.processed_at), 'dd.MM.yyyy HH:mm', { locale: de })
            : 'Noch nicht abgeschlossen'}
        </p>
      </div>
    </details>
  )
}
