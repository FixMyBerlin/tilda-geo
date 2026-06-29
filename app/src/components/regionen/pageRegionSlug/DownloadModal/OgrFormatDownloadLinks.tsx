import { useCallback, useEffect, useState } from 'react'
import type { SourceExportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import { getAppBaseUrl } from '@/components/shared/utils/getAppBaseUrl'
import { getExportStartApiBboxUrl } from '@/components/shared/utils/getExportApiUrl'
import type { StaticRegion } from '@/data/regions.const'
import type { Formats } from '@/server/api/export/ogrFormats.const'
import { ogrFormats } from '@/server/api/export/ogrFormats.const'

export const downloadFormatLinkClasses =
  'min-w-28 w-max flex-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-left shadow-sm hover:bg-yellow-50 focus:ring-1 focus:ring-yellow-500'

type Props = {
  regionSlug: string
  tableName: SourceExportApiIdentifier
  bbox: NonNullable<StaticRegion['bbox']>
}

type Phase = 'idle' | 'running' | 'error'
const POLL_INTERVAL_MS = 1000

/** Starts an async export job, polls its progress and triggers the browser download when ready. */
const useFormatExport = (
  regionSlug: string,
  tableName: SourceExportApiIdentifier,
  bbox: NonNullable<StaticRegion['bbox']>,
  format: Formats,
) => {
  const [phase, setPhase] = useState<Phase>('idle')
  const [percent, setPercent] = useState(0)
  const [jobId, setJobId] = useState<string | null>(null)

  const triggerDownload = useCallback((id: string) => {
    const link = document.createElement('a')
    link.href = getAppBaseUrl(`/api/export-download/${id}`)
    link.download = ''
    document.body.appendChild(link)
    link.click()
    link.remove()
  }, [])

  // Poll the running job; the effect cleanup also cancels polling on unmount (e.g. modal closed).
  useEffect(() => {
    if (!jobId || phase !== 'running') return

    let cancelled = false
    const interval = setInterval(async () => {
      try {
        const res = await fetch(getAppBaseUrl(`/api/export-status/${jobId}`), {
          credentials: 'include',
        })
        if (!res.ok) throw new Error(`status ${res.status}`)
        const data: { status: 'running' | 'done' | 'error'; percent: number } = await res.json()
        if (cancelled) return

        setPercent(data.percent)
        if (data.status === 'done') {
          triggerDownload(jobId)
          setJobId(null)
          setPhase('idle')
          setPercent(0)
        } else if (data.status === 'error') {
          setJobId(null)
          setPhase('error')
        }
      } catch {
        if (cancelled) return
        setJobId(null)
        setPhase('error')
      }
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [jobId, phase, triggerDownload])

  const start = useCallback(async () => {
    setPhase('running')
    setPercent(0)
    try {
      const res = await fetch(getExportStartApiBboxUrl(regionSlug, tableName, bbox, format), {
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`start ${res.status}`)
      const { jobId: newJobId } = (await res.json()) as { jobId: string }
      setJobId(newJobId)
    } catch {
      setPhase('error')
    }
  }, [regionSlug, tableName, bbox, format])

  return { phase, percent, start }
}

const OgrFormatDownloadButton = ({
  regionSlug,
  tableName,
  bbox,
  format,
  driver,
}: Props & { format: Formats; driver: string }) => {
  const { phase, percent, start } = useFormatExport(regionSlug, tableName, bbox, format)

  return (
    <button
      type="button"
      onClick={start}
      disabled={phase === 'running'}
      className={`${downloadFormatLinkClasses} relative overflow-hidden disabled:cursor-progress`}
    >
      <strong className="mb-0.5 block text-xs font-medium text-gray-500">
        {phase === 'running' ? `${percent} %` : phase === 'error' ? 'Fehler' : 'Download'}
      </strong>
      <span className="block border-0 p-0 font-mono text-gray-900 focus:ring-0 sm:text-sm">
        {phase === 'error' ? 'Erneut versuchen' : driver}
      </span>
      {phase === 'running' && (
        <span
          className="absolute bottom-0 left-0 h-1 bg-yellow-500 transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      )}
    </button>
  )
}

export const OgrFormatDownloadLinks = ({ regionSlug, tableName, bbox }: Props) => {
  return (
    <>
      {Object.entries(ogrFormats).map(([param, format]) => (
        <OgrFormatDownloadButton
          key={param}
          regionSlug={regionSlug}
          tableName={tableName}
          bbox={bbox}
          format={param as Formats}
          driver={format.driver}
        />
      ))}
    </>
  )
}
