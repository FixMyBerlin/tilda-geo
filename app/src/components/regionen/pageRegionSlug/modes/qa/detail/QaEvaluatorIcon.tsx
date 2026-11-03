import { twMerge } from 'tailwind-merge'
import type { QaEvaluatorType } from '@/prisma/generated/browser'
import { evaluatorTypeConfig } from './qaConfigs'

type Props = {
  evaluatorType: QaEvaluatorType
  className?: string
}

/** Who decided a status: the system or a user. */
export const QaEvaluatorIcon = ({ evaluatorType, className }: Props) => {
  const { icon: Icon, label } = evaluatorTypeConfig[evaluatorType]
  return <Icon className={twMerge('size-3.5 shrink-0 text-gray-500', className)} title={label} />
}
