import { formatDateTime } from '@/src/app/_components/date/formatDate'
import { formatRelativeTime } from '@/src/app/_components/date/relativeTime'
import { Markdown } from '@/src/app/_components/text/Markdown'
import { evaluatorTypeConfig, systemStatusConfig, userStatusConfig } from './qaConfigs'

type Props = {
  evaluations: any[] // QaEvaluation[] from Prisma
}

export const QaEvaluationHistory = ({ evaluations }: Props) => {
  if (evaluations.length === 0) return null

  return (
    <div className="flow-root">
      <ul className="space-y-3">
        {evaluations.map((evaluation) => {
          const date = new Date(evaluation.createdAt)
          const datetimeFormatted = formatDateTime(date)
          const relativeTime = formatRelativeTime(date)
          const evaluatorConfig = evaluatorTypeConfig[evaluation.evaluatorType]
          const systemConfig = systemStatusConfig[evaluation.systemStatus]
          const userConfig = evaluation.userStatus ? userStatusConfig[evaluation.userStatus] : null
          const authorName = evaluation.author
            ? evaluation.author.osmName ||
              `${evaluation.author.firstName} ${evaluation.author.lastName}`.trim() ||
              'Unbekannter Nutzer'
            : 'System'

          return (
            <li key={evaluation.id} className="flex gap-3">
              <span className="flex h-5 w-5 items-center justify-center rounded-full">
                <evaluatorConfig.icon
                  className={`h-4 w-4 ${evaluatorConfig.color}`}
                  aria-hidden="true"
                />
              </span>
              <div className="mb-3 w-full">
                <div className="flex min-w-0 flex-1 justify-between space-x-4">
                  <div className="text-sm text-gray-500">{authorName}</div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    <time title={datetimeFormatted}>{relativeTime}</time>
                  </div>
                </div>

                {/* Current Status - Show only the active status for this evaluation */}
                <div className="mt-1 flex items-center gap-2">
                  {userConfig ? (
                    // User evaluation takes precedence
                    <>
                      <div
                        className="h-3 w-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: userConfig.hexColor }}
                      />
                      <span className="text-sm font-medium text-gray-700">{userConfig.label}</span>
                    </>
                  ) : (
                    // System evaluation
                    <>
                      <div
                        className="h-3 w-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: systemConfig.hexColor }}
                      />
                      <span className="text-sm text-gray-700">{systemConfig.label}</span>
                    </>
                  )}
                </div>

                {/* Comment */}
                {evaluation.body && (
                  <Markdown
                    markdown={evaluation.body}
                    className="prose-sm mr-1 mt-2 border-l border-gray-400 pl-2 prose-p:leading-tight prose-p:text-gray-500 prose-ol:pl-3 prose-ol:leading-tight prose-ul:pl-3 prose-ul:leading-tight prose-li:m-0 prose-li:p-0 prose-li:marker:text-gray-500"
                  />
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
