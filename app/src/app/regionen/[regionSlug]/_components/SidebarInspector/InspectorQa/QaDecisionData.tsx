import { formatNumber, formatPercentage } from '@/src/app/_components/utils/formatNumber'
import { QaDecisionData as QaDecisionDataType } from '@/src/server/qa-configs/queries/getQaDecisionDataForArea'
import { QaDecisionDataStored } from '@/src/server/qa-configs/schemas/qaDecisionDataSchema'

type Props = {
  decisionData: QaDecisionDataType | QaDecisionDataStored | null
}

export const QaDecisionData = ({ decisionData }: Props) => {
  if (!decisionData) {
    return null
  }

  return (
    <div className="prose prose-sm mb-3 rounded-lg bg-gray-50 p-3">
      <p>
        Aktuell:{' '}
        <strong className="font-semibold">{formatNumber(decisionData.currentCount)}</strong> —{' '}
        Referenz:{' '}
        <strong className="font-semibold">{formatNumber(decisionData.referenceCount)}</strong>
        <br />
        {formatPercentage(decisionData.relative)} der Referenz
        <br />
        {decisionData.absoluteChange !== null && (
          <>
            {decisionData.absoluteChange > 0 ? '-' : '+'}
            {formatNumber(Math.abs(decisionData.absoluteChange))} Stellplätze
          </>
        )}
      </p>
    </div>
  )
}
