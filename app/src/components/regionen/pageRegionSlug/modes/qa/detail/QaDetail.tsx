import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IntlProvider } from 'react-intl'
import {
  applyQaDecisionsToMapRow,
  qaMapDataQueryOptions,
  restoreQaMapDataRow,
  upsertQaMapDataRow,
  type QaMapDataRow,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/useQaMapData'
import { useQaParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useQaParam'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { translations } from '@/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/translations.const'
import { AdminLogDataButton } from '@/components/shared/debug/AdminLogDataButton'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { toastError } from '@/components/shared/toast/toastError'
import {
  createQaEvaluationsFn,
  getQaDecisionDataForAreaFn,
} from '@/server/qa-configs/qa-configs.functions'
import { qaMapPayloadAppliesDefault } from '@/shared/qaMapDefaultStatus'
import { modePanelMutedClassName } from '../../modePanel.const'
import { groupQaThread } from './groupQaThread'
import { QaDecisionForm, type QaEvaluationDecisionInput } from './QaDecisionForm'
import { QaIndicatorValues } from './QaIndicatorValues'
import { QaThread } from './QaThread'

type Props = {
  areaId: string
}

export const QaDetail = ({ areaId }: Props) => {
  const regionSlug = useRegionSlug()
  const { qaParamData } = useQaParam()
  const queryClient = useQueryClient()

  const decisionDataQueryKey = ['qaDecisionData', qaParamData.key, areaId, regionSlug]
  const { data: decisionData, isError: isDecisionDataError } = useQuery({
    queryKey: decisionDataQueryKey,
    queryFn: () =>
      getQaDecisionDataForAreaFn({
        data: { configSlug: qaParamData.key, areaId, regionSlug },
      }),
    enabled: Boolean(regionSlug && qaParamData.key),
  })

  const indicators = decisionData?.indicators ?? []

  const mapDataQueryKey =
    qaParamData.key && regionSlug
      ? qaMapDataQueryOptions({
          configSlug: qaParamData.key,
          regionSlug,
          userIds: qaParamData.users ?? [],
          search: qaParamData.search,
        }).queryKey
      : null

  // Optimistic update: patch only the decided indicators' letters in the map payload cache
  // (`applyQaDecisionsToMapRow`) — `useQaMapState` reacts to the cache change and repaints the
  // cell with the current filters, so the feature-state doesn't need to be touched here directly.
  const { mutateAsync: createEvaluationsMutation, isPending } = useMutation({
    mutationFn: (input: {
      configSlug: string
      regionSlug: string
      areaId: string
      body?: string
      decisions: QaEvaluationDecisionInput[]
    }) => createQaEvaluationsFn({ data: input }),
    onMutate: (input) => {
      if (!mapDataQueryKey) return {}
      const currentMapData = queryClient.getQueryData<QaMapDataRow[]>(mapDataQueryKey) ?? []
      const previousRow = currentMapData.find((item) => item.areaId === areaId)
      const applyDefault = qaMapPayloadAppliesDefault({
        search: qaParamData.search,
        userIds: qaParamData.users,
      })
      const nextRow = applyQaDecisionsToMapRow(
        previousRow,
        areaId,
        indicators,
        input.decisions,
        applyDefault,
      )
      queryClient.setQueryData(mapDataQueryKey, upsertQaMapDataRow(currentMapData, nextRow))
      return { previousRow }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: decisionDataQueryKey })
      // Area list, user dropdown, and map payload all derive from evaluations.
      queryClient.invalidateQueries({ queryKey: ['qa-configs'] })
    },
    onError: (error, _variables, context) => {
      if (mapDataQueryKey) {
        const currentMapData = queryClient.getQueryData<QaMapDataRow[]>(mapDataQueryKey) ?? []
        queryClient.setQueryData(
          mapDataQueryKey,
          restoreQaMapDataRow(currentMapData, areaId, context?.previousRow),
        )
      }
      toastError(error, 'QA-Bewertung konnte nicht gespeichert werden')
    },
  })

  const handleSubmit = async (
    decisions: QaEvaluationDecisionInput[],
    comment: string | undefined,
  ) => {
    await createEvaluationsMutation({
      configSlug: qaParamData.key,
      regionSlug,
      areaId,
      body: comment,
      decisions,
    })
  }

  return (
    <IntlProvider messages={translations} locale="de" defaultLocale="de">
      {/* Text sizes of this panel: `text-sm` for content, `text-xs text-gray-500` for labels,
          descriptions and times, and smaller only for the difference numbers (QaChange). */}
      <div className="flex flex-col gap-4 p-3 text-sm">
        {isDecisionDataError ? (
          <p className={modePanelMutedClassName}>
            Bewertungsgrundlage konnte nicht geladen werden.
          </p>
        ) : null}

        {decisionData && indicators.length === 0 ? (
          <p className={modePanelMutedClassName}>
            Für diesen Bereich liegen noch keine Werte vor. Entweder wurde die Konfiguration noch
            nicht verarbeitet oder ihre Indikatoren haben noch keine Referenzwerte.
          </p>
        ) : decisionData ? (
          <>
            <QaIndicatorValues indicators={indicators} />
            <div className="border-t border-gray-200 pt-3">
              <QaDecisionForm
                indicators={indicators}
                onSubmit={handleSubmit}
                isSubmitting={isPending}
              />
            </div>
            <QaThread entries={groupQaThread(indicators)} />
          </>
        ) : !isDecisionDataError ? (
          <div className="flex items-center gap-2">
            <SmallSpinner />
          </div>
        ) : null}

        <AdminLogDataButton data={{ areaId, decisionData }} />
      </div>
    </IntlProvider>
  )
}
