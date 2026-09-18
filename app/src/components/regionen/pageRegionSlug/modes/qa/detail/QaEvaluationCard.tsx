import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { useQueryClient } from '@tanstack/react-query'
import { twJoin } from 'tailwind-merge'
import { TimeWithRelativeTooltip } from '@/components/shared/date/TimeWithRelativeTooltip'
import { MotionCollapse } from '@/components/shared/motion/MotionCollapse'
import { updateQaEvaluationBodyFn } from '@/server/qa-configs/qa-configs.functions'
import type { QaEvaluationForArea } from '@/server/qa-configs/queries/getQaEvaluationsForArea.server'
import { useRegionSlug } from '../../../regionUtils/useRegionSlug'
import { ModeCommentEditButton } from '../../ModeCommentEditButton'
import { ModeCommentMarkdown } from '../../ModeCommentMarkdown'
import { ModePanelPill } from '../../ModePanelPill'
import { wasUpdated } from '../../notes/detail/utils/wasUpdated'
import { systemStatusConfig, userStatusConfig } from './qaConfigs'
import { QaDecisionData as QaDecisionDataComponent } from './QaDecisionData'
import { QaEvaluatorDisplay } from './QaEvaluatorDisplay'

type Props = {
  evaluation: Pick<
    QaEvaluationForArea,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
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
  const regionSlug = useRegionSlug()
  const queryClient = useQueryClient()
  const systemConfig = systemStatusConfig[evaluation.systemStatus]
  const userConfig = evaluation.userStatus ? userStatusConfig[evaluation.userStatus] : null
  const statusConfig = userConfig ?? systemConfig

  const isHeader = variant === 'header'
  const cardClasses = isHeader
    ? 'space-y-2 rounded-lg bg-white p-3 w-full'
    : 'space-y-2 rounded-lg border border-gray-200 p-3 w-full'

  const isSystem = evaluation.evaluatorType === 'SYSTEM'

  const statusPill = statusConfig ? (
    <ModePanelPill backgroundColor={statusConfig.hexColor}>{statusConfig.label}</ModePanelPill>
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

      <ModeCommentMarkdown markdown={evaluation.body} />

      {!isSystem && evaluation.author ? (
        <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
          <span>
            {wasUpdated(evaluation) ? (
              <>
                Kommentar aktualisiert <TimeWithRelativeTooltip date={evaluation.updatedAt} />
              </>
            ) : null}
          </span>
          <ModeCommentEditButton
            authorId={evaluation.author.id}
            body={evaluation.body ?? ''}
            mode="qa"
            onSave={async (body) => {
              await updateQaEvaluationBodyFn({
                data: { regionSlug, evaluationId: evaluation.id, body },
              })
              await queryClient.invalidateQueries({ queryKey: ['qaEvaluations'] })
              // Area rows show a comment count.
              await queryClient.invalidateQueries({ queryKey: ['qa-configs', 'getQaAreaList'] })
            }}
          />
        </div>
      ) : null}
    </div>
  )
}
