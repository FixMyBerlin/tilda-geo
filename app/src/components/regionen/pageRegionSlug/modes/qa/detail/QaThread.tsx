import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { useQueryClient } from '@tanstack/react-query'
import { twJoin } from 'tailwind-merge'
import { TimeWithRelativeTooltip } from '@/components/shared/date/TimeWithRelativeTooltip'
import { DisclosureChevron } from '@/components/shared/DisclosureChevron/DisclosureChevron'
import { MotionCollapse } from '@/components/shared/motion/MotionCollapse'
import { updateQaEvaluationBodyFn } from '@/server/qa-configs/qa-configs.functions'
import { useRegionSlug } from '../../../regionUtils/useRegionSlug'
import { ModeCommentEditButton } from '../../ModeCommentEditButton'
import { ModeCommentMarkdown } from '../../ModeCommentMarkdown'
import { ModePanelPill } from '../../ModePanelPill'
import { wasUpdated } from '../../notes/detail/utils/wasUpdated'
import type { QaThreadEntry } from './groupQaThread'
import { QaAttributeLabel } from './QaAttributeLabel'
import { qaStatusPillConfig } from './qaConfigs'
import { QaDecisionData } from './QaDecisionData'
import { QaEvaluatorDisplay } from './QaEvaluatorDisplay'

type Props = {
  entries: QaThreadEntry[]
}

const QaThreadEntryCard = ({ entry }: { entry: QaThreadEntry }) => {
  const regionSlug = useRegionSlug()
  const queryClient = useQueryClient()
  const first = entry.items[0]?.evaluation
  if (!first) return null
  const isSystem = first.evaluatorType === 'SYSTEM'

  return (
    <li
      className={
        isSystem
          ? 'space-y-2 rounded-lg border border-dashed border-gray-300 p-3'
          : 'space-y-2 rounded-lg border border-gray-200 bg-white p-3'
      }
    >
      {/* One line: the name is cut, the OSM handle and the time keep their width. */}
      <header className="flex min-w-0 items-baseline gap-x-1.5">
        {isSystem ? (
          <span className="truncate font-medium text-gray-900">System-Bewertung</span>
        ) : (
          <>
            <QaEvaluatorDisplay
              evaluation={first}
              showOsmHandle={false}
              className="min-w-0 truncate font-medium text-gray-900"
            />
            <QaEvaluatorDisplay evaluation={first} showDisplayName={false} className="shrink-0" />
          </>
        )}
        <TimeWithRelativeTooltip date={first.createdAt} className="ml-auto shrink-0 pl-1 text-xs" />
      </header>

      <ul className="space-y-1">
        {entry.items.map(({ indicator, evaluation }) => {
          const pill = qaStatusPillConfig(evaluation)
          const line = (
            <>
              <QaAttributeLabel label={indicator.label} className="text-gray-700" />
              <ModePanelPill backgroundColor={pill.hexColor}>{pill.label}</ModePanelPill>
            </>
          )
          const lineClassName =
            'flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-0.5'
          const decisionData = evaluation.decisionData
          if (!decisionData) {
            return (
              <li key={evaluation.id} className={lineClassName}>
                {line}
              </li>
            )
          }
          // The line opens the values the evaluation was based on.
          return (
            <Disclosure as="li" key={evaluation.id}>
              {({ open }) => (
                <>
                  <DisclosureButton
                    className={twJoin(
                      lineClassName,
                      'cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                    )}
                  >
                    <span className="inline-flex items-center gap-0.5">
                      <DisclosureChevron open={open} side="leading" className="size-3.5" />
                      <QaAttributeLabel label={indicator.label} className="text-gray-700" />
                    </span>
                    <ModePanelPill backgroundColor={pill.hexColor}>{pill.label}</ModePanelPill>
                  </DisclosureButton>
                  <MotionCollapse open={open}>
                    <DisclosurePanel static className="space-y-1 pt-1 pb-2">
                      <div className="text-xs text-gray-500">Werte zu diesem Zeitpunkt</div>
                      <QaDecisionData decisionData={decisionData} indicator={indicator} />
                    </DisclosurePanel>
                  </MotionCollapse>
                </>
              )}
            </Disclosure>
          )
        })}
      </ul>

      <ModeCommentMarkdown markdown={first.body} />

      {!isSystem && first.author ? (
        <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
          <span>
            {wasUpdated(first) ? (
              <>
                Kommentar aktualisiert <TimeWithRelativeTooltip date={first.updatedAt} />
              </>
            ) : null}
          </span>
          <ModeCommentEditButton
            authorId={first.author.id}
            body={first.body ?? ''}
            mode="qa"
            onSave={async (body) => {
              // The comment is stored on every evaluation of the save.
              await Promise.all(
                entry.items.map(({ evaluation }) =>
                  updateQaEvaluationBodyFn({
                    data: { regionSlug, evaluationId: evaluation.id, body },
                  }),
                ),
              )
              await queryClient.invalidateQueries({ queryKey: ['qaDecisionData'] })
              // Area rows show a comment count.
              await queryClient.invalidateQueries({ queryKey: ['qa-configs', 'getQaAreaList'] })
            }}
          />
        </div>
      ) : null}
    </li>
  )
}

/** The history of an area: decisions and system evaluations of all attributes, newest first. */
export const QaThread = ({ entries }: Props) => {
  if (entries.length === 0) return null

  return (
    <section className="space-y-2">
      <h4 className="font-medium text-gray-900">Verlauf</h4>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <QaThreadEntryCard key={entry.items[0]?.evaluation.id} entry={entry} />
        ))}
      </ul>
    </section>
  )
}
