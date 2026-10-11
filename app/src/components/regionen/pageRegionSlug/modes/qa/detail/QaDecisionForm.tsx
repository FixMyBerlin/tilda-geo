import { useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { MarkdownEditor } from '@/components/shared/form/fields/MarkdownEditor'
import type { QaEvaluationStatus } from '@/prisma/generated/browser'
import type { QaDecisionDataIndicator } from '@/server/qa-configs/queries/getQaDecisionDataForArea.server'
import { isOpenQaIndicator } from '@/shared/qaIndicatorStatus'
import { ModeFormSubmit } from '../../ModeFormSubmit'
import { ModePanelPill } from '../../ModePanelPill'
import { QaAttributeLabel } from './QaAttributeLabel'
import { qaStatusPillConfig, userStatusOptions } from './qaConfigs'

export type QaEvaluationDecisionInput = {
  indicatorKey: string
  userStatus: QaEvaluationStatus
}

type Props = {
  indicators: QaDecisionDataIndicator[]
  onSubmit: (decisions: QaEvaluationDecisionInput[], comment: string | undefined) => Promise<void>
  isSubmitting: boolean
}

const optionListClassName =
  'isolate flex flex-col divide-y divide-gray-300 overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm'
const optionClassName = (selected: boolean) =>
  twJoin(
    'flex cursor-pointer items-start gap-2 p-3 select-none focus-within:relative focus-within:z-10',
    selected ? 'bg-yellow-50' : 'hover:bg-gray-50',
  )
const optionInputClassName =
  'mt-0.5 size-4 shrink-0 border-gray-300 text-yellow-600 focus:ring-brand'

/**
 * One decision for an area: which attributes it is about (the open ones are preselected), the
 * decision, and one comment.
 */
export const QaDecisionForm = ({ indicators, onSubmit, isSubmitting }: Props) => {
  const [selectedKeys, setSelectedKeys] = useState(() =>
    indicators.filter((indicator) => isOpenQaIndicator(indicator)).map(({ key }) => key),
  )
  const [userStatus, setUserStatus] = useState<QaEvaluationStatus | null>(null)
  const [comment, setComment] = useState('')

  // With one attribute there is nothing to choose.
  const keys = indicators.length === 1 ? indicators.map(({ key }) => key) : selectedKeys

  const toggleKey = (key: string) =>
    setSelectedKeys((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key],
    )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!userStatus || keys.length === 0) return
    try {
      await onSubmit(
        keys.map((indicatorKey) => ({ indicatorKey, userStatus })),
        comment || undefined,
      )
    } catch {
      // The mutation shows the error; the choices stay for a retry.
      return
    }
    setUserStatus(null)
    setComment('')
    setSelectedKeys([])
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h4 className="font-medium text-gray-900">Bewertung hinzufügen</h4>

      {indicators.length > 1 && (
        <fieldset>
          <legend className="sr-only">Gilt für</legend>
          <div className={optionListClassName}>
            {indicators.map((indicator) => {
              const selected = selectedKeys.includes(indicator.key)
              const pill = qaStatusPillConfig(indicator)
              return (
                <label key={indicator.key} className={optionClassName(selected)}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleKey(indicator.key)}
                    disabled={isSubmitting}
                    className={twJoin(optionInputClassName, 'rounded')}
                  />
                  <span className="flex min-w-0 grow flex-wrap items-center justify-between gap-2">
                    <QaAttributeLabel
                      prefix="Gilt für"
                      label={indicator.label}
                      className="font-medium text-gray-900"
                    />
                    <ModePanelPill backgroundColor={pill.hexColor}>{pill.label}</ModePanelPill>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
      )}

      <div role="radiogroup" aria-label="Bewertung" className={optionListClassName}>
        {userStatusOptions.map((option) => {
          const selected = userStatus === option.value
          return (
            <label key={option.value} className={optionClassName(selected)}>
              <input
                type="radio"
                name="qaUserStatus"
                value={option.value}
                checked={selected}
                onChange={() => setUserStatus(option.value)}
                disabled={isSubmitting}
                className={optionInputClassName}
              />
              <div className="min-w-0">
                <ModePanelPill backgroundColor={option.hexColor}>{option.label}</ModePanelPill>
                <div className="mt-1 text-xs text-gray-500">{option.description}</div>
              </div>
            </label>
          )
        })}
      </div>

      <div className="space-y-1">
        <span className="font-medium text-gray-900">Kommentar (Markdown)</span>
        <MarkdownEditor
          value={comment}
          onChange={setComment}
          disabled={isSubmitting}
          placeholder="Zusätzliche Anmerkungen…"
          toolbar="comment"
        />
      </div>

      <ModeFormSubmit
        label="Speichern"
        pending={isSubmitting}
        disabled={!userStatus || keys.length === 0}
      />
    </form>
  )
}
