import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { adminCardClassName } from '@/components/admin/adminClasses'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminIntro } from '@/components/admin/AdminIntro'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { Link } from '@/components/shared/links/Link'
import type { TopicId } from '@/data/processingTypes/topicId.generated.const'
import type { ChartPhaseFilter } from '@/server/processing/parseTopicTimings'
import {
  collectOrphanedTopicIdsFromRuns,
  getRunsForChart,
} from '@/server/processing/parseTopicTimings'
import { ProcessingChartFilters } from './ProcessingChartFilters'
import { ProcessingOrphanedTopicsNotice } from './ProcessingOrphanedTopicsNotice'
import { ProcessingRunsTable } from './ProcessingRunsTable'
import { ProcessingRunStackChart } from './ProcessingRunStackChart'
import { ProcessingStatusPill } from './ProcessingStatusPill'

const routeApi = getRouteApi('/admin/processing/')

const sectionTitleClassName = 'text-base/7 font-semibold text-gray-900'

export function PageProcessing() {
  const { runs, latestRuns } = routeApi.useLoaderData()
  const latestRun = latestRuns[0]
  const [topicFilter, setTopicFilter] = useState<TopicId | 'all'>('all')
  const [phaseFilter, setPhaseFilter] = useState<ChartPhaseFilter>('both')
  const chartRuns = getRunsForChart(latestRuns)
  const orphanedTopicIds = collectOrphanedTopicIdsFromRuns(chartRuns)

  return (
    <>
      <AdminPageHeader
        title="Processing-Läufe"
        intro={
          <AdminIntro>
            <p>
              Laufzeiten der OSM-Verarbeitung pro Topic. Tabellen unter <code>data.*</code>{' '}
              verwaltet <Link to="/admin/data-schema">Data-Schema</Link>. Manuelle Auslöser für die
              nachgelagerten Schritte stehen unter{' '}
              <Link to="/admin/processing/hooks">Pipeline-Hooks</Link>.
            </p>
          </AdminIntro>
        }
      />

      <div className="space-y-8">
        <section
          aria-labelledby="processing-chart-title"
          className={twJoin(adminCardClassName, 'p-4 sm:p-6')}
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="processing-chart-title" className={sectionTitleClassName}>
                14-Tage-Übersicht
              </h2>
              <p className="mt-1 text-sm/6 text-gray-600">
                Gestapelte Laufzeiten pro Lauf (Lua hell, SQL dunkler).
              </p>
            </div>
            {latestRun ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                Letzter Lauf
                <ProcessingStatusPill status={latestRun.status} />
              </div>
            ) : null}
          </div>

          <ProcessingChartFilters
            topicFilter={topicFilter}
            phaseFilter={phaseFilter}
            onTopicFilterChange={setTopicFilter}
            onPhaseFilterChange={setPhaseFilter}
          />

          <div className="mt-6">
            <ProcessingRunStackChart
              runs={latestRuns}
              topicFilter={topicFilter}
              phaseFilter={phaseFilter}
            />
            <ProcessingOrphanedTopicsNotice
              topicIds={orphanedTopicIds}
              className="mt-4 text-sm text-gray-600"
            />
          </div>
        </section>

        <section aria-labelledby="processing-runs-title" className="space-y-4">
          <h2 id="processing-runs-title" className={sectionTitleClassName}>
            Läufe
          </h2>
          {runs.rows.length === 0 ? (
            <AdminEmptyState>Noch keine Processing-Läufe vorhanden.</AdminEmptyState>
          ) : (
            <ProcessingRunsTable runs={runs.rows} footer={<AdminPagination pagination={runs} />} />
          )}
        </section>
      </div>
    </>
  )
}
