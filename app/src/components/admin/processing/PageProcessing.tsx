import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { AdminPrivateHooksSection } from '@/components/admin/AdminPrivateHooksSection'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
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

const sectionClassName = twMerge(
  'rounded-xl bg-white/90 p-4 shadow-sm ring-1 ring-gray-900/5 sm:p-6',
)

export function PageProcessing() {
  const { runs } = routeApi.useLoaderData()
  const latestRun = runs[0]
  const [topicFilter, setTopicFilter] = useState<TopicId | 'all'>('all')
  const [phaseFilter, setPhaseFilter] = useState<ChartPhaseFilter>('both')
  const chartRuns = getRunsForChart(runs)
  const orphanedTopicIds = collectOrphanedTopicIdsFromRuns(chartRuns)

  return (
    <div className="mx-auto max-w-6xl">
      <HeaderWrapper>
        <Breadcrumb pages={[{ href: '/admin/processing', name: 'Processing' }]} />
      </HeaderWrapper>

      <section className={sectionClassName}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">14-Tage-Übersicht</h2>
            <p className="mt-1 text-sm text-gray-600">
              Gestapelte Fläche über Zeit (Lua hell, SQL dunkler) — Laufzeiten pro Run im Vergleich.
            </p>
          </div>
          {latestRun ? <ProcessingStatusPill status={latestRun.status} /> : null}
        </div>

        <ProcessingChartFilters
          topicFilter={topicFilter}
          phaseFilter={phaseFilter}
          onTopicFilterChange={setTopicFilter}
          onPhaseFilterChange={setPhaseFilter}
        />

        <div className="mt-6">
          <ProcessingRunStackChart
            runs={runs}
            topicFilter={topicFilter}
            phaseFilter={phaseFilter}
          />
          <ProcessingOrphanedTopicsNotice
            topicIds={orphanedTopicIds}
            className="mt-4 text-sm text-gray-600"
          />
        </div>
      </section>

      <section className={twMerge(sectionClassName, 'mt-8')}>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Läufe</h2>
        <ProcessingRunsTable runs={runs} />
      </section>

      <AdminPrivateHooksSection />
    </div>
  )
}
