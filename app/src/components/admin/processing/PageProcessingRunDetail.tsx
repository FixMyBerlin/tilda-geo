import { getRouteApi } from '@tanstack/react-router'
import { differenceInMilliseconds, format } from 'date-fns'
import { de } from 'date-fns/locale'
import { AdminDescriptionList } from '@/components/admin/AdminDescriptionList'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { AdminTechnicalDetails } from '@/components/admin/AdminTechnicalDetails'
import { AdminAsideActions } from '@/components/admin/aside/AdminAsideActions'
import { AdminAsideBackLink } from '@/components/admin/aside/AdminAsideBackLink'
import { AdminAsideLayout } from '@/components/admin/aside/AdminAsideLayout'
import { toAdminAsideSections } from '@/components/admin/aside/adminAsideSection'
import { AdminFormSection } from '@/components/admin/aside/AdminFormSection'
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
import {
  formatParsedTopicDurations,
  TopicTimingMicroBar,
  TopicTimingStatus,
} from './topicTimingDisplay'

const routeApi = getRouteApi('/admin/processing/$metaId')

/** Section ids (jump list + URL hash) and titles; `orphaned` only when the run has any. */
const sectionLabels = {
  times: 'Zeiten',
  topics: 'Topics',
  orphaned: 'Veraltete Topics',
  afterthoughts: 'Nachgelagerte Schritte',
  technical: 'Technische Details',
} satisfies Record<string, string>

const formatDateTime = (date: Date | string | null | undefined) =>
  date ? format(date, 'dd.MM.yyyy HH:mm', { locale: de }) : null

export function PageProcessingRunDetail() {
  const { run } = routeApi.useLoaderData()
  const parsedTopics = parseRunTopics(run.topics)
  const orphanedTopics = parseOrphanedRunTopics(run.topics)
  const hasOrphaned = orphanedTopics.length > 0
  const { orphaned: _orphaned, ...labelsWithoutOrphaned } = sectionLabels

  return (
    <>
      <AdminPageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            Lauf #{run.id}
            <ProcessingStatusPill status={run.status} />
          </span>
        }
        parent={{ label: 'Processing-Läufe', to: '/admin/processing' }}
      />

      <AdminAsideLayout
        sections={toAdminAsideSections(hasOrphaned ? sectionLabels : labelsWithoutOrphaned)}
        actions={
          <AdminAsideActions
            primary={<AdminAsideBackLink to="/admin/processing" label="Zur Übersicht" />}
          />
        }
      >
        <AdminFormSection id="times" title={sectionLabels.times}>
          <AdminDescriptionList
            items={[
              { label: 'Gestartet', value: formatDateTime(run.processing_started_at) },
              {
                label: 'Hauptverarbeitung abgeschlossen',
                value: formatDateTime(run.processing_completed_at),
              },
              {
                label: 'Dauer (Topics + Types)',
                value: formatProcessingDuration(run.processing_duration),
              },
              { label: 'OSM-Daten', value: formatDateTime(run.osm_data_from) },
              { label: 'QA gestartet', value: formatDateTime(run.qa_update_started_at) },
              { label: 'QA abgeschlossen', value: formatDateTime(run.qa_update_completed_at) },
            ]}
          />
        </AdminFormSection>

        <AdminFormSection id="topics" title={sectionLabels.topics}>
          <AdminTable
            header={[
              'Topic',
              'Status',
              'Lua',
              'SQL',
              'Diff',
              'Gesamt',
              { id: 'share', label: 'Anteil Lua / SQL', srOnly: true },
            ]}
          >
            {parsedTopics.map((parsed) => {
              const schedule = topicScheduleById[parsed.topicId]
              const durations = formatParsedTopicDurations(parsed)

              return (
                <tr key={parsed.topicId}>
                  <th scope="row" className={adminTableClasses.thRow}>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className="font-mono text-sm">{parsed.topicId}</span>
                      <Pill color={schedule === 'weekend' ? 'yellow' : 'gray'}>{schedule}</Pill>
                    </div>
                  </th>
                  <td className={adminTableClasses.td}>
                    <TopicTimingStatus parsed={parsed} />
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
        </AdminFormSection>

        {hasOrphaned ? (
          <AdminFormSection
            id="orphaned"
            title={sectionLabels.orphaned}
            description="In den Metadaten gespeichert, aber nicht mehr in der aktuellen Topic-Liste."
          >
            <ProcessingOrphanedTopicsTable topics={orphanedTopics} />
          </AdminFormSection>
        ) : null}

        <AdminFormSection
          id="afterthoughts"
          title={sectionLabels.afterthoughts}
          description="Arbeit nach der Hauptverarbeitung — nicht im Topic-Diagramm enthalten."
        >
          <AdminTable header={['Schritt', 'Status', 'Dauer']}>
            {afterthoughtIds.map((id) => {
              const entry = run.afterthoughts[id]
              const durationMs =
                entry && !isAfterthoughtSkipped(entry)
                  ? differenceInMilliseconds(new Date(entry.end), new Date(entry.start))
                  : undefined

              return (
                <tr key={id}>
                  <th scope="row" className={adminTableClasses.thRow}>
                    {afterthoughtLabels[id]} <code className="text-xs text-gray-500">{id}</code>
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
        </AdminFormSection>

        <AdminTechnicalDetails
          id="technical"
          items={[
            { label: 'ID', value: run.id },
            { label: 'Status', value: <code>{run.status}</code> },
          ]}
          dumps={[
            { title: 'Topics', data: run.topics },
            { title: 'Nachgelagerte Schritte', data: run.afterthoughts },
            { title: 'Lauf', data: run },
          ]}
        />
      </AdminAsideLayout>
    </>
  )
}
