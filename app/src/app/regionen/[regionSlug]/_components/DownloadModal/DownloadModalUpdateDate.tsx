import { SmallSpinner } from '@/src/app/_components/Spinner/SmallSpinner'
import getAtlasGeoMetadata from '@/src/server/regions/queries/getAtlasGeoMetadata'
import { useQuery } from '@blitzjs/rpc'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Suspense } from 'react'

export const DownloadModalUpdateDate = () => {
  return (
    <p className="flex items-center gap-2 pb-5 text-sm">
      Letzte Aktualisierung der Daten:{' '}
      <Suspense fallback={<SmallSpinner />}>
        <DownloadModalUpdateDateDate />
      </Suspense>
    </p>
  )
}

const DownloadModalUpdateDateDate = () => {
  const [metadata] = useQuery(getAtlasGeoMetadata, {})

  if (!metadata?.osm_data_from) return null
  const date = new Date(metadata.osm_data_from)
  return (
    <>
      {format(date, 'dd.MM.yyyy', { locale: de })}{' '}
      <span className="text-gray-400">{format(date, 'HH:mm', { locale: de })}</span>
    </>
  )
}
