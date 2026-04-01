import { Link } from '@/components/shared/links/Link'
import type { getQaConfigsForAdmin } from '@/server/qa-configs/queries/getQaConfigsForAdmin.server'
import { QaConfigStatsTable } from './QaConfigStatsTable'

type QaConfigWithRelations = Awaited<ReturnType<typeof getQaConfigsForAdmin>>[number]

export function QaConfigCard({ config }: { config: QaConfigWithRelations }) {
  return (
    <div className="not-prose mb-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h3 className="m-0 p-0 text-lg font-semibold leading-tight text-gray-900">
            {config.label}
          </h3>
          <span
            className={`inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
              config.isActive ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {config.isActive ? 'Aktiv' : 'Inaktiv'}
          </span>
        </div>
        <Link
          button
          className="shrink-0"
          to="/admin/qa-configs/$id/edit"
          params={{ id: String(config.id) }}
        >
          Bearbeiten
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <div>
          <span className="font-medium text-gray-500">Region:</span>
          <span className="ml-2 text-gray-900">{config.region.slug}</span>
        </div>
        <div>
          <span className="font-medium text-gray-500">Slug:</span>
          <span className="ml-2 text-gray-900">{config.slug}</span>
        </div>
        <div>
          <span className="font-medium text-gray-500">Map Table:</span>
          <span className="ml-2 text-gray-900">{config.mapTable}</span>
        </div>
        <div>
          <span className="font-medium text-gray-500">Evaluations:</span>
          <span className="ml-2 text-gray-900">{config._count.qaEvaluations}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
        <div>
          <span className="font-medium text-gray-500">Good Threshold:</span>
          <span className="ml-2 text-gray-900">{config.goodThreshold}</span>
        </div>
        <div>
          <span className="font-medium text-gray-500">Needs Review:</span>
          <span className="ml-2 text-gray-900">{config.needsReviewThreshold}</span>
        </div>
        <div>
          <span className="font-medium text-gray-500">Absolute threshold:</span>
          <span className="ml-2 text-gray-900">{config.absoluteDifferenceThreshold}</span>
        </div>
      </div>

      <QaConfigStatsTable configId={config.id} />
    </div>
  )
}
