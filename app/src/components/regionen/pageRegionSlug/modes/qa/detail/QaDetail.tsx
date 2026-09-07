import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useOptimistic, useState } from 'react'
import { IntlProvider } from 'react-intl'
import { useMap } from 'react-map-gl/maplibre'
import { ObjectDump } from '@/components/admin/ObjectDump'
import {
  qaMapDataQueryOptions,
  restoreQaMapDataRow,
  upsertQaMapDataRow,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/useQaMapData'
import { useQaParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useQaParam'
import { safeSetFeatureState } from '@/components/regionen/pageRegionSlug/Map/utils/safeSetFeatureState'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { translations } from '@/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/translations.const'
import { TimeWithRelativeTooltip } from '@/components/shared/date/TimeWithRelativeTooltip'
import { buttonStylesOnYellow } from '@/components/shared/links/styles'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { toastError } from '@/components/shared/toast/toastError'
import { isDev } from '@/components/shared/utils/isEnv'
import {
  getQaDecisionDataForAreaFn,
  getQaEvaluationsForAreaFn,
} from '@/server/qa-configs/qa-configs.functions'
import type { CreateQaEvaluationInput } from '@/server/qa-configs/qa-configs.functions'
import { createQaEvaluationFn } from '@/server/qa-configs/qa-configs.functions'
import type { QaEvaluationForArea } from '@/server/qa-configs/queries/getQaEvaluationsForArea.server'
import { qaEvalDraftId } from '../../composerDrafts/composerDraftIds'
import { isEmptyComposerDraftValues } from '../../composerDrafts/composerDraftStorage'
import { useComposerDraft } from '../../composerDrafts/useComposerDraft'
import { modePanelMutedClassName } from '../../modePanel.const'
import { QA_MAP_DEFAULT_STATUS } from '../qaMapDefaultStatus'
import { SYSTEM_STATUS_TO_LETTER, USER_STATUS_TO_LETTER, userStatusConfig } from './qaConfigs'
import { QaDecisionData as QaDecisionDataComponent } from './QaDecisionData'
import { QaEvaluationCard } from './QaEvaluationCard'
import { QaEvaluationForm } from './QaEvaluationForm'
import { QaEvaluationHistory } from './QaEvaluationHistory'

type QaMapFeatureStateSnapshot = {
  userStatus: string | null
  systemStatus: string | null
}

const systemStatusLetters = new Set<string>(Object.values(SYSTEM_STATUS_TO_LETTER))

const systemStatusLetter = (value: unknown) => {
  if (typeof value === 'string' && systemStatusLetters.has(value)) {
    return value as (typeof SYSTEM_STATUS_TO_LETTER)[keyof typeof SYSTEM_STATUS_TO_LETTER]
  }
  return undefined
}

type Props = {
  areaId: string
}

export const QaDetail = ({ areaId }: Props) => {
  const regionSlug = useRegionSlug()
  const { qaParamData } = useQaParam()
  const { mainMap } = useMap()
  const [showForm, setShowForm] = useState(false)
  const [draftSessionKey, setDraftSessionKey] = useState(0)
  const queryClient = useQueryClient()
  const draftId = qaEvalDraftId(regionSlug, qaParamData.key, areaId)
  const { isReady, draftValues, saveDraft, clearDraft } = useComposerDraft(draftId, draftSessionKey)
  const hasDraft = Boolean(draftValues && !isEmptyComposerDraftValues(draftValues))

  const evaluationsQueryKey = ['qaEvaluations', qaParamData.key, areaId, regionSlug]
  const { data: evaluations, isError: isEvaluationsError } = useQuery<QaEvaluationForArea[]>({
    queryKey: evaluationsQueryKey,
    queryFn: () =>
      getQaEvaluationsForAreaFn({
        data: {
          configSlug: qaParamData.key,
          areaId,
          regionSlug: regionSlug,
        },
      }),
    enabled: Boolean(regionSlug && qaParamData.key),
  })

  const { data: decisionData, isError: isDecisionDataError } = useQuery({
    queryKey: ['qaDecisionData', qaParamData.key, areaId, regionSlug],
    queryFn: () =>
      getQaDecisionDataForAreaFn({
        data: {
          configSlug: qaParamData.key,
          areaId,
          regionSlug: regionSlug,
        },
      }),
    enabled: Boolean(regionSlug && qaParamData.key),
  })

  const mapDataQueryKey =
    qaParamData.key && regionSlug
      ? qaMapDataQueryOptions({
          configSlug: qaParamData.key,
          regionSlug,
          userIds: qaParamData.users ?? [],
          search: qaParamData.search,
        }).queryKey
      : null

  const latestEvaluation = evaluations?.[0]
  const hasEvaluation = !!latestEvaluation
  const systemStatus = latestEvaluation?.systemStatus
  const baseUserStatus = latestEvaluation?.userStatus ?? null

  // React 19: useOptimistic for optimistic UI updates with automatic rollback
  // useOptimistic automatically syncs with baseUserStatus when it changes
  const [optimisticUserStatus, setOptimisticUserStatus] = useOptimistic<string | null, string>(
    baseUserStatus,
    (_currentStatus, newStatus: string) => newStatus,
  )

  // Use optimistic status for UI (useOptimistic handles base state internally)
  const userStatus = optimisticUserStatus
  const hasUserEvaluation = hasEvaluation && userStatus !== null

  const queryRenderedQaFeature = () => {
    if (!mainMap) return undefined
    return mainMap.queryRenderedFeatures({
      layers: ['qa-layer'],
      filter: ['==', ['get', 'id'], areaId],
    })[0]
  }

  const applyOptimisticMapUpdate = (status: string) => {
    const statusConfig = userStatusConfig[status as keyof typeof userStatusConfig]
    if (!statusConfig) return

    const targetFeature = queryRenderedQaFeature()
    const currentMapData = mapDataQueryKey ? (queryClient.getQueryData(mapDataQueryKey) ?? []) : []
    const payloadItem = currentMapData.find((item) => item.areaId === areaId)
    const optimisticSystemStatus =
      systemStatusLetter(targetFeature?.state?.systemStatus) ??
      payloadItem?.systemStatus ??
      QA_MAP_DEFAULT_STATUS.systemStatus

    if (targetFeature && mainMap) {
      safeSetFeatureState(mainMap, targetFeature, {
        userStatus: USER_STATUS_TO_LETTER[status as keyof typeof USER_STATUS_TO_LETTER],
        systemStatus: optimisticSystemStatus,
      })
    }

    if (!mapDataQueryKey) return

    queryClient.setQueryData(
      mapDataQueryKey,
      upsertQaMapDataRow(currentMapData, {
        areaId,
        systemStatus: optimisticSystemStatus,
        userStatus: USER_STATUS_TO_LETTER[status as keyof typeof USER_STATUS_TO_LETTER],
      }),
    )
  }

  const { mutate: createEvaluationMutation, isPending } = useMutation({
    mutationFn: (input: CreateQaEvaluationInput) => createQaEvaluationFn({ data: input }),
    onMutate: (input) => {
      const currentMapData = mapDataQueryKey
        ? (queryClient.getQueryData(mapDataQueryKey) ?? [])
        : []
      const previousRow = currentMapData.find((item) => item.areaId === areaId)
      const targetFeature = queryRenderedQaFeature()
      const previousFeatureState: QaMapFeatureStateSnapshot | undefined = targetFeature
        ? {
            userStatus: (targetFeature.state?.userStatus as string | null | undefined) ?? null,
            systemStatus: (targetFeature.state?.systemStatus as string | null | undefined) ?? null,
          }
        : undefined

      applyOptimisticMapUpdate(input.userStatus)
      return {
        previousRow: previousRow ? { ...previousRow } : undefined,
        previousFeatureState,
      }
    },
    onSuccess: () => {
      clearDraft()
      setDraftSessionKey((key) => key + 1)
      queryClient.invalidateQueries({ queryKey: evaluationsQueryKey })
    },
    onError: (error, _variables, context) => {
      if (mapDataQueryKey) {
        const currentMapData = queryClient.getQueryData(mapDataQueryKey) ?? []
        queryClient.setQueryData(
          mapDataQueryKey,
          restoreQaMapDataRow(currentMapData, areaId, context?.previousRow),
        )
      }

      const targetFeature = queryRenderedQaFeature()
      if (targetFeature && context?.previousFeatureState && mainMap) {
        safeSetFeatureState(mainMap, targetFeature, context.previousFeatureState)
      }

      toastError(error, 'QA-Bewertung konnte nicht gespeichert werden')
    },
  })

  const handleSubmit = (values: { userStatus: string; comment?: string }) => {
    const { userStatus: submittedStatus, comment: body } = values
    setOptimisticUserStatus(submittedStatus)

    createEvaluationMutation({
      configSlug: qaParamData.key,
      areaId: areaId,
      regionSlug: regionSlug,
      userStatus: submittedStatus as CreateQaEvaluationInput['userStatus'],
      body,
      decisionData: decisionData || undefined,
    })

    setShowForm(false)
  }

  // Determine form visibility based on UX state
  // Primary: System evaluation exists but no user evaluation
  // Secondary: Everything else (no evaluation OR has user evaluation)
  const shouldShowFormPrimary = hasEvaluation && systemStatus !== null && userStatus === null
  const isFormVisible = shouldShowFormPrimary || (!shouldShowFormPrimary && showForm) || hasDraft

  return (
    <IntlProvider messages={translations} locale="de" defaultLocale="de">
      <div className="flex flex-col gap-7 p-3 text-sm">
        {isEvaluationsError ? (
          <p className={modePanelMutedClassName}>Bewertungen konnten nicht geladen werden.</p>
        ) : null}
        {isDecisionDataError ? (
          <p className={modePanelMutedClassName}>
            Bewertungsgrundlage konnte nicht geladen werden.
          </p>
        ) : null}
        {latestEvaluation && (
          <div>
            <h4 className="mb-2 font-medium text-gray-900">Aktuelle Bewertung</h4>
            <QaEvaluationCard evaluation={latestEvaluation} variant="header" />
          </div>
        )}

        {decisionData && (
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="font-medium text-gray-900">Letzte Bewertungsgrundlage</h4>
              {latestEvaluation && <TimeWithRelativeTooltip date={latestEvaluation.createdAt} />}
            </div>
            <QaDecisionDataComponent decisionData={decisionData} />
          </div>
        )}

        <section>
          {!isReady ? (
            <div className="flex items-center gap-2">
              <SmallSpinner />
            </div>
          ) : isFormVisible ? (
            <QaEvaluationForm
              onSubmit={handleSubmit}
              isLoading={isPending}
              draftId={draftId}
              defaultValues={
                {
                  userStatus: draftValues?.userStatus ?? '',
                  comment: draftValues?.comment ?? '',
                } satisfies { userStatus: string; comment: string }
              }
              saveDraft={saveDraft}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className={buttonStylesOnYellow}
            >
              {hasUserEvaluation ? 'Bewertung aktualisieren' : 'Bewertung hinzufügen'}
            </button>
          )}
        </section>

        {evaluations && evaluations.length > 1 && (
          <div>
            <h4 className="mb-2 font-medium text-gray-900">
              Bewertungsverlauf ({evaluations.length - 1})
            </h4>
            <QaEvaluationHistory evaluations={evaluations} />
          </div>
        )}
        {isDev && <ObjectDump title="decisionData" data={decisionData} />}
        {isDev && <ObjectDump title="areaId" data={{ areaId }} />}
        {isDev && <ObjectDump title="evaluations" data={evaluations} />}
      </div>
    </IntlProvider>
  )
}
