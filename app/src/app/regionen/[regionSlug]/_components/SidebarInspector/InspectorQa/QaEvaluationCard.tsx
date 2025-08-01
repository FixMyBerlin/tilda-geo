import { formatDateTime } from '@/src/app/_components/date/formatDate'
import { formatRelativeTime } from '@/src/app/_components/date/relativeTime'
import { Markdown } from '@/src/app/_components/text/Markdown'
import getQaEvaluationsForArea from '@/src/server/qa-configs/queries/getQaEvaluationsForArea'
import { systemStatusConfig, userStatusConfig } from './qaConfigs'
import { QaEvaluatorDisplay } from './QaEvaluatorDisplay'

type Props = {
  evaluation: Awaited<ReturnType<typeof getQaEvaluationsForArea>>[number]
  variant?: 'header' | 'history'
}

export const QaEvaluationCard = ({ evaluation, variant = 'history' }: Props) => {
  const date = new Date(evaluation.createdAt)
  const systemConfig = systemStatusConfig[evaluation.systemStatus]
  const userConfig = evaluation.userStatus ? userStatusConfig[evaluation.userStatus] : null

  const isHeader = variant === 'header'
  const pillPadding = isHeader ? 'px-3 py-1' : 'px-2 py-1'
  const cardClasses = isHeader
    ? 'space-y-3 rounded-lg bg-white p-4'
    : 'space-y-2 rounded-lg border border-gray-200 p-3'

  return (
    <div className={cardClasses}>
      {/* 1. Status Pill and Username */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {userConfig ? (
            <div
              className={`rounded-full text-xs font-medium text-white ${pillPadding}`}
              style={{ backgroundColor: userConfig.hexColor }}
            >
              {userConfig.label}
            </div>
          ) : systemConfig ? (
            <div
              className={`rounded-full text-xs font-medium text-white ${pillPadding}`}
              style={{ backgroundColor: systemConfig.hexColor }}
            >
              {systemConfig.label}
            </div>
          ) : null}
        </div>
        <QaEvaluatorDisplay evaluation={evaluation} />
      </div>

      {/* 2. Comment */}
      {evaluation.body && (
        <div className="text-sm text-gray-700">
          <Markdown
            markdown={evaluation.body}
            className="prose-li:p:0 prose-sm prose-p:leading-tight prose-p:text-gray-700 prose-ol:leading-tight prose-ul:leading-tight prose-li:m-0"
          />
        </div>
      )}

      {/* 3. Date */}
      <div className="text-xs text-gray-500">
        <time title={formatRelativeTime(date)}>{formatDateTime(date)}</time>
      </div>
    </div>
  )
}
