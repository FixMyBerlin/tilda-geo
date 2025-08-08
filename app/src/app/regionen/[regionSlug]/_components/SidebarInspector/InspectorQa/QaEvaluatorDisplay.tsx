import getQaEvaluationsForArea from '@/src/server/qa-configs/queries/getQaEvaluationsForArea'
import { OsmUserLink } from '../OsmUserLink'
import { evaluatorTypeConfig } from './qaConfigs'

type Props = {
  evaluation: Pick<
    Awaited<ReturnType<typeof getQaEvaluationsForArea>>[number],
    'evaluatorType' | 'author'
  >
  className?: string
}

export const QaEvaluatorDisplay = ({ evaluation, className = '' }: Props) => {
  const evaluatorConfig = evaluatorTypeConfig[evaluation.evaluatorType]

  const getAuthorDisplay = () => {
    if (evaluation.evaluatorType === 'SYSTEM') {
      return <span className="text-sm font-medium text-gray-900">System</span>
    }

    if (evaluation.author) {
      return (
        <OsmUserLink
          firstName={evaluation.author.firstName}
          lastName={evaluation.author.lastName}
          osmName={evaluation.author.osmName}
          showMembership={false}
        />
      )
    }

    return <span className="text-sm font-medium text-gray-900">{evaluatorConfig.label}</span>
  }

  return (
    <div className={`flex items-center gap-2 leading-tight ${className}`}>
      <span className="flex size-5 items-center justify-center rounded-full bg-white">
        <evaluatorConfig.icon className={`size-4 ${evaluatorConfig.color}`} aria-hidden="true" />
      </span>
      <span>{getAuthorDisplay()}</span>
    </div>
  )
}
