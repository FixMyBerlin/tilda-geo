import { Link } from '@/src/app/_components/links/Link'
import { QaConfig } from '@prisma/client'

type QaConfigWithRelations = QaConfig & {
  region: {
    slug: string
    name?: string
  }
  _count: {
    qaEvaluations: number
  }
}

export function QaConfigCard({ config }: { config: QaConfigWithRelations }) {
  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-3">
            <h3 className="my-0 text-lg font-semibold text-gray-900">{config.label}</h3>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                config.isActive ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
              }`}
            >
              {config.isActive ? 'Aktiv' : 'Inaktiv'}
            </span>
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
              <span className="font-medium text-gray-500">Problematic:</span>
              <span className="ml-2 text-gray-900">{config.problematicThreshold}</span>
            </div>
          </div>
        </div>

        <div className="ml-4">
          <Link button href={`/admin/qa-configs/${config.id}/edit`}>
            Bearbeiten
          </Link>
        </div>
      </div>
    </div>
  )
}
