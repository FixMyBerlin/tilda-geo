import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { twJoin } from 'tailwind-merge'
import { TimeWithRelativeTooltip } from '@/components/shared/date/TimeWithRelativeTooltip'
import { MotionCollapse } from '@/components/shared/motion/MotionCollapse'
import { Markdown } from '@/components/shared/text/Markdown'
import type { QaEvaluationForArea } from '@/server/qa-configs/queries/getQaEvaluationsForArea.server'
import { systemStatusConfig, userStatusConfig } from './qaConfigs'
import { QaDecisionData as QaDecisionDataComponent } from './QaDecisionData'
import { QaEvaluatorDisplay } from './QaEvaluatorDisplay'

type Props = {
  evaluation: Pick<
    QaEvaluationForArea,
    | 'createdAt'
    | 'systemStatus'
    | 'userStatus'
    | 'body'
    | 'evaluatorType'
    | 'author'
    | 'decisionData'
  >
  variant?: 'header' | 'history'
}

export const QaEvaluationCard = ({ evaluation, variant = 'history' }: Props) => {
  const systemConfig = systemStatusConfig[evaluation.systemStatus]
  const userConfig = evaluation.userStatus ? userStatusConfig[evaluation.userStatus] : null
  const statusConfig = userConfig ?? systemConfig

  const isHeader = variant === 'header'
  const cardClasses = isHeader
    ? 'space-y-2 rounded-lg bg-white p-3 w-full'
    : 'space-y-2 rounded-lg border border-gray-200 p-3 w-full'

  const isSystem = evaluation.evaluatorType === 'SYSTEM'

  const statusPill = statusConfig ? (
    <div
      className="w-fit rounded-full px-2 py-1 text-xs font-medium text-white"
      style={{ backgroundColor: statusConfig.hexColor }}
    >
      {statusConfig.label}
    </div>
  ) : null

  return (
    <div className={cardClasses}>
      <header className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
        <div className="flex max-w-full min-w-0 flex-wrap items-baseline justify-between gap-x-1.5">
          <span className="font-medium text-gray-900">
            {isSystem ? (
              'System-Bewertung'
            ) : (
              <QaEvaluatorDisplay evaluation={evaluation} showOsmHandle={false} />
            )}
          </span>
          {!isSystem ? (
            <span className="font-normal">
              <QaEvaluatorDisplay evaluation={evaluation} showDisplayName={false} />
            </span>
          ) : null}
        </div>
        <TimeWithRelativeTooltip date={evaluation.createdAt} className="ml-auto" />
      </header>

      {evaluation.decisionData ? (
        <Disclosure as="div">
          {({ open }) => (
            <>
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                {statusPill}
                <DisclosureButton className="ml-auto inline-flex cursor-pointer items-center gap-0.5 text-gray-600 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                  <ChevronRightIcon
                    className={twJoin(
                      'size-4 shrink-0 transition-transform',
                      open && 'rotate-90 transform',
                    )}
                    aria-hidden="true"
                  />
                  Bewertungsgrundlage
                </DisclosureButton>
              </div>
              <MotionCollapse open={open}>
                <DisclosurePanel static className="pt-2">
                  <QaDecisionDataComponent decisionData={evaluation.decisionData} />
                </DisclosurePanel>
              </MotionCollapse>
            </>
          )}
        </Disclosure>
      ) : (
        statusPill
      )}

      {evaluation.body && (
        <div className="text-gray-700">
          <Markdown
            markdown={evaluation.body}
            className="prose-li:p:0 prose-sm prose-p:leading-tight prose-p:text-gray-700 prose-ol:leading-tight prose-ul:leading-tight prose-li:m-0"
          />
        </div>
      )}
    </div>
  )
}
