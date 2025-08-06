import { QaEvaluationCard } from './QaEvaluationCard'

type Props = {
  evaluations: any[] // QaEvaluation[] from Prisma
}

export const QaEvaluationHistory = ({ evaluations }: Props) => {
  // Show only follow-up entries (exclude the first one)
  const followUpEvaluations = evaluations.slice(1)

  if (followUpEvaluations.length === 0) return null

  return (
    <ul className="space-y-2">
      {followUpEvaluations.map((evaluation) => (
        <li key={evaluation.id}>
          <QaEvaluationCard evaluation={evaluation} variant="history" />
        </li>
      ))}
    </ul>
  )
}
