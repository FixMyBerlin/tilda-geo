import { OsmUserLink } from '@/components/regionen/pageRegionSlug/SidebarInspector/OsmUserLink'
import type { QaEvaluationForArea } from '@/server/qa-configs/queries/getQaEvaluationsForArea.server'
import { evaluatorTypeConfig } from './qaConfigs'

type Props = {
  evaluation: Pick<QaEvaluationForArea, 'evaluatorType' | 'author'>
  className?: string
  showDisplayName?: boolean
  showOsmHandle?: boolean
}

/** Author / evaluator label without icon (icons unused elsewhere in the QA UI). */
export const QaEvaluatorDisplay = ({
  evaluation,
  className = '',
  showDisplayName = true,
  showOsmHandle = true,
}: Props) => {
  const evaluatorConfig = evaluatorTypeConfig[evaluation.evaluatorType]

  if (evaluation.evaluatorType === 'SYSTEM') {
    if (!showDisplayName) return null
    return <span className={`text-sm font-medium text-gray-900 ${className}`}>System</span>
  }

  if (evaluation.author) {
    if (!showOsmHandle) {
      const displayName = [evaluation.author.firstName, evaluation.author.lastName]
        .filter(Boolean)
        .join(' ')
      return <span className={className}>{displayName || evaluation.author.osmName}</span>
    }

    return (
      <span className={className}>
        <OsmUserLink
          firstName={evaluation.author.firstName}
          lastName={evaluation.author.lastName}
          osmName={evaluation.author.osmName}
          showMembership={false}
          showDisplayName={showDisplayName}
        />
      </span>
    )
  }

  return (
    <span className={`text-sm font-medium text-gray-900 ${className}`}>
      {evaluatorConfig.label}
    </span>
  )
}
