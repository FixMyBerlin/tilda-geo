import { getRouteApi } from '@tanstack/react-router'
import { differenceInMilliseconds, format } from 'date-fns'
import { de } from 'date-fns/locale'
import { twMerge } from 'tailwind-merge'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { ObjectDump } from '@/components/admin/ObjectDump'
import { Pill } from '@/components/shared/text/Pill'
import {
  afterthoughtIds,
  afterthoughtLabels,
  afterthoughtSkipReasonLabels,
} from '@/data/processingTypes/afterthoughts.const'
import { topicScheduleById } from '@/data/processingTypes/topicId.generated.const'
import {
  formatDurationMs,
  formatProcessingDuration,
  parseOrphanedRunTopics,
  parseRunTopics,
} from '@/server/processing/parseTopicTimings'
import { isAfterthoughtSkipped } from '@/server/processing/schemas'
import { ProcessingOrphanedTopicsTable } from './ProcessingOrphanedTopicsTable'
import { ProcessingStatusPill } from './ProcessingStatusPill'
import { TopicTimingMicroBar, formatParsedTopicDurations } from './topicTimingDisplay'

const routeApi = getRouteApi('/admin/processing/$metaId')

const cardClassName = twMerge('rounded-xl bg-white/90 p-4 shadow-sm ring-1 ring-gray-900/5 sm:p-6')

const skipReasonLabels = {
  weekend: 'Wochenende',
  unchanged: 'Unverändert',
  process_only_topics: 'PROCESS_ONLY_TOPICS',
} as const

export function PageProcessingRunDetail() {
  const { run } = routeApi.useLoaderData()
  const parsedTopics = parseRunTopics(run.topics)
  const orphanedTopics = parseOrphanedRunTopics(run.topics)

  return (
    <div className="mx-auto max-w-6xl">
      <HeaderWrapper>
        <Breadcrumb
          pages={[
            { href: '/admin/processing', name: 'Processing' },
            { href: `/admin/processing/${run.id}`, name: `Run #${run.id}` },
          ]}
        />
      </HeaderWrapper>

      <section className={cardClassName}>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Run #{run.id}</h1>
          <ProcessingStatusPill status={run.status} />
        </div>

        <dl className="mt-4 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
          <div>
            <dt className="font-medium text-gray-900">Gestartet</dt>
            <dd>{format(run.processing_started_at, 'dd.MM.yyyy HH:mm', { locale: de })}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">Hauptverarbeitung abgeschlossen</dt>
            <dd>
              {run.processing_completed_at
                ? format(run.processing_completed_at, 'dd.MM.yyyy HH:mm', { locale: de })
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">Dauer (Topics + Types)</dt>
            <dd>{formatProcessingDuration(run.processing_duration)}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">OSM-Daten</dt>
            <dd>
              {run.osm_data_from
                ? format(run.osm_data_from, 'dd.MM.yyyy HH:mm', { locale: de })
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">QA gestartet</dt>
            <dd>
              {run.qa_update_started_at
                ? format(run.qa_update_started_at, 'dd.MM.yyyy HH:mm', { locale: de })
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">QA abgeschlossen</dt>
            <dd>
              {run.qa_update_completed_at
                ? format(run.qa_update_completed_at, 'dd.MM.yyyy HH:mm', { locale: de })
                : '—'}
            </dd>
          </div>
        </dl>
      </section>

      <section className={twMerge(cardClassName, 'mt-8')}>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Topics</h2>
        <AdminTable header={['Topic', 'Status', 'Lua', 'SQL', 'Diff', 'Gesamt', '']}>
          {parsedTopics.map((parsed) => {
            const schedule = topicScheduleById[parsed.topicId]
            const durations = formatParsedTopicDurations(parsed)

            return (
              <tr key={parsed.topicId}>
                <th scope="row" className={adminTableClasses.thRow}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm">{parsed.topicId}</span>
                    <Pill color={schedule === 'weekend' ? 'purple' : 'gray'}>{schedule}</Pill>
                  </div>
                </th>
                <td className={adminTableClasses.td}>
                  {parsed.status === 'not_recorded' ? (
                    <span className="text-gray-500">Nicht erfasst</span>
                  ) : parsed.status === 'skipped' ? (
                    <span className="text-gray-600">
                      Übersprungen
                      {parsed.skipReason
                        ? ` (${skipReasonLabels[parsed.skipReason as keyof typeof skipReasonLabels] ?? parsed.skipReason})`
                        : ''}
                    </span>
                  ) : (
                    'Abgeschlossen'
                  )}
                </td>
                <td className={adminTableClasses.td}>{durations.lua}</td>
                <td className={adminTableClasses.td}>{durations.sql}</td>
                <td className={adminTableClasses.td}>{durations.diff}</td>
                <td className={adminTableClasses.td}>{durations.total}</td>
                <td className={adminTableClasses.td}>
                  {parsed.status === 'completed' ? (
                    <TopicTimingMicroBar
                      topicId={parsed.topicId}
                      luaMs={parsed.luaMs}
                      sqlMs={parsed.sqlMs}
                    />
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            )
          })}
        </AdminTable>
        <ProcessingOrphanedTopicsTable topics={orphanedTopics} />
      </section>

      <section className={twMerge(cardClassName, 'mt-8')}>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Afterthoughts</h2>
        <p className="mb-4 text-sm text-gray-600">
          Deferred work after main processing — not included in the topic chart.
        </p>
        <AdminTable header={['Step', 'Status', 'Dauer']}>
          {afterthoughtIds.map((id) => {
            const entry = run.afterthoughts[id]
            const durationMs =
              entry && !isAfterthoughtSkipped(entry)
                ? differenceInMilliseconds(new Date(entry.end), new Date(entry.start))
                : undefined

            return (
              <tr key={id}>
                <th scope="row" className={adminTableClasses.thRow}>
                  <span className="font-mono text-sm">{afterthoughtLabels[id]}</span>
                </th>
                <td className={adminTableClasses.td}>
                  {!entry ? (
                    <span className="text-gray-500">Nicht erfasst</span>
                  ) : isAfterthoughtSkipped(entry) ? (
                    <span className="text-gray-600">
                      Übersprungen ({afterthoughtSkipReasonLabels[entry.skipped]})
                    </span>
                  ) : (
                    'Abgeschlossen'
                  )}
                </td>
                <td className={adminTableClasses.td}>{formatDurationMs(durationMs)}</td>
              </tr>
            )
          })}
        </AdminTable>
      </section>

      <section className={twMerge(cardClassName, 'mt-8')}>
        <ObjectDump title={`Run #${run.id} — topics`} data={run.topics} />
      </section>

      <section className={twMerge(cardClassName, 'mt-8')}>
        <ObjectDump title={`Run #${run.id} — afterthoughts`} data={run.afterthoughts} />
      </section>
    </div>
  )
}
