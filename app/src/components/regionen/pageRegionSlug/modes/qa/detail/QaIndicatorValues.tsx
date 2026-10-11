import type { QaDecisionDataIndicator } from '@/server/qa-configs/queries/getQaDecisionDataForArea.server'
import { qaEffectiveStatus } from '@/shared/qaIndicatorStatus'
import { ModePanelPill } from '../../ModePanelPill'
import { QaAttributeLabel } from './QaAttributeLabel'
import { qaStatusPillConfig } from './qaConfigs'
import { QaDecisionData } from './QaDecisionData'

type Props = {
  indicators: QaDecisionDataIndicator[]
}

const isGood = (indicator: QaDecisionDataIndicator) => {
  const status = qaEffectiveStatus(indicator)
  return status === 'GOOD' || status === 'TRUSTED_EDITOR_CHANGE'
}

/** The attributes of an area with their status and values, the ones with findings first. */
export const QaIndicatorValues = ({ indicators }: Props) => {
  const sorted = [...indicators.filter((i) => !isGood(i)), ...indicators.filter(isGood)]

  return (
    <ul className="space-y-4">
      {sorted.map((indicator) => {
        const pill = qaStatusPillConfig(indicator)
        return (
          <li key={indicator.key} className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <QaAttributeLabel label={indicator.label} className="font-medium text-gray-900" />
              <ModePanelPill backgroundColor={pill.hexColor}>{pill.label}</ModePanelPill>
            </div>
            <QaDecisionData decisionData={indicator.decisionData} indicator={indicator} />
          </li>
        )
      })}
    </ul>
  )
}
