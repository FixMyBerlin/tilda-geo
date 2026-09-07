import { PlusIcon } from '@heroicons/react/24/outline'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { useMapActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useFeaturesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { frenchQuote } from '@/components/shared/text/Quotes'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import {
  reviewEntriesQueryOptions,
  reviewListsQueryOptions,
} from '@/server/regions/regionQueryOptions'
import { ModeFilterBar } from '../ModeFilterBar'
import { ModeFilterSelect, modeFilterIcons } from '../ModeFilterSelect'
import { ModePanel } from '../ModePanel'
import { modePanelHeaderIconButtonClassName } from '../modePanel.const'
import { useModeDetailSelection } from '../useModeDetailSelection'
import { ReviewEntryDetail } from './detail/ReviewEntryDetail'
import { ReviewEntryDetailActions } from './detail/ReviewEntryDetailActions'
import { ReviewEntryNew } from './new/ReviewEntryNew'
import { ReviewListManageMenu, ReviewListSelect } from './ReviewListSelect'
import { REVIEW_STATUS_FILTER_OPTIONS } from './reviewListsModeFilters'
import { ReviewListsModeList } from './ReviewListsModeList'
import { useReviewListCommands } from './useReviewListCommands'
import { useReviewListsModeParam } from './useReviewListsModeParam'

export const PageModeReviewLists = () => {
  const region = useRegion()
  const canManage = useHasPermissions()
  const { setFeaturesParam } = useFeaturesParam()
  const { clearInspectorFeatures } = useMapActions()
  const { selected, clearModeDetail } = useModeDetailSelection()
  const { reviewListsMode, setReviewListsModeParam } = useReviewListsModeParam()

  // Primed by the route loader (ensureQueryData), so this suspends only on hard refresh races
  // and cooperates with the route pendingComponent.
  const { data: listsData } = useSuspenseQuery(reviewListsQueryOptions(region.slug))
  const lists = listsData.lists
  const selectedListId = reviewListsMode.key ?? lists[0]?.id
  const selectedList = lists.find((list) => list.id === selectedListId)

  const { data: entriesData, isLoading } = useQuery({
    ...reviewEntriesQueryOptions(region.slug, selectedListId),
    enabled: selectedListId !== undefined,
  })

  const search = reviewListsMode.search ?? ''
  const extent = reviewListsMode.extent ?? 'view'

  const updateFilter = (patch: Partial<typeof reviewListsMode>) =>
    setReviewListsModeParam({ ...reviewListsMode, ...patch })

  const features = entriesData?.featureCollection.features ?? []

  const sharedRegionSlugs = (selectedList?.regionSlugs ?? []).filter((slug) => slug !== region.slug)

  const onSelectList = (list: number) =>
    setReviewListsModeParam({
      ...reviewListsMode,
      key: list === lists[0]?.id ? undefined : list,
      move: undefined,
    })

  const reviewListCommands = useReviewListCommands({
    regionSlug: region.slug,
    lists,
    selectedListId,
    onSelect: onSelectList,
  })

  const isComposing = reviewListsMode.new === true
  const selectedEntryId = selected ? Number(selected.id) : undefined

  const openNewEntry = () => {
    clearInspectorFeatures()
    clearModeDetail()
    setFeaturesParam(null, { replace: true })
    setReviewListsModeParam({ ...reviewListsMode, new: true, move: undefined })
  }

  const closeCompose = () => setReviewListsModeParam({ ...reviewListsMode, new: undefined })
  const closeDetail = () => {
    setReviewListsModeParam({ ...reviewListsMode, move: undefined })
    clearModeDetail()
  }
  const composeDetail = isComposing
    ? {
        title: 'Neuer Prüfeintrag',
        onBack: closeCompose,
        children: <ReviewEntryNew />,
      }
    : undefined
  const reviewDetail =
    !isComposing && selected && selectedEntryId !== undefined && !Number.isNaN(selectedEntryId)
      ? {
          title: `Prüfeintrag #${selectedEntryId}`,
          onBack: closeDetail,
          children: <ReviewEntryDetail entryId={selectedEntryId} />,
        }
      : undefined
  const panelDetail = composeDetail ?? reviewDetail

  return (
    <ModePanel
      title={selectedList ? `Liste ${frenchQuote(selectedList.name)}` : 'Prüflisten'}
      detail={panelDetail}
      subtitle={
        sharedRegionSlugs.length > 0
          ? `Liste geteilt mit: ${sharedRegionSlugs.join(', ')}`
          : undefined
      }
      collectionAlwaysOpen={lists.length === 0}
      collection={
        <ReviewListSelect
          lists={lists}
          canManage={canManage}
          selectedListId={selectedListId}
          onSelect={onSelectList}
          commands={reviewListCommands}
        />
      }
      actions={
        composeDetail ? undefined : reviewDetail &&
          canManage &&
          selectedEntryId !== undefined &&
          selectedListId !== undefined ? (
          <ReviewEntryDetailActions entryId={selectedEntryId} listId={selectedListId} />
        ) : lists.length === 0 ? (
          canManage ? (
            <Tooltip text="Neue Prüfliste">
              <button
                type="button"
                onClick={(event) => reviewListCommands.openNameModal('create', event.currentTarget)}
                aria-label="Neue Prüfliste"
                className={modePanelHeaderIconButtonClassName}
              >
                <PlusIcon className="size-5" aria-hidden />
              </button>
            </Tooltip>
          ) : undefined
        ) : (
          <>
            {canManage ? (
              <Tooltip text="Neuer Eintrag">
                <button
                  type="button"
                  onClick={openNewEntry}
                  aria-label="Neuer Eintrag"
                  className={modePanelHeaderIconButtonClassName}
                >
                  <PlusIcon className="size-5" aria-hidden />
                </button>
              </Tooltip>
            ) : null}
            <ReviewListManageMenu
              regionSlug={region.slug}
              canManage={canManage}
              selectedListId={selectedListId}
              commands={reviewListCommands}
            />
          </>
        )
      }
      filter={
        <ModeFilterBar
          search={search}
          onSearchChange={(value) => updateFilter({ search: value || undefined })}
          searchPlaceholder="Einträge durchsuchen…"
          extent={extent}
          onExtentChange={(next) => setReviewListsModeParam({ ...reviewListsMode, extent: next })}
        >
          <ModeFilterSelect
            label="Status"
            icon={modeFilterIcons.status}
            value={reviewListsMode.status ?? 'all'}
            options={REVIEW_STATUS_FILTER_OPTIONS}
            onChange={(value) =>
              updateFilter({
                status: value === 'all' ? undefined : value,
              })
            }
          />
        </ModeFilterBar>
      }
    >
      <ReviewListsModeList
        features={features}
        isLoading={isLoading}
        selectedListId={selectedListId}
        canManage={canManage}
        onOpenNewEntry={openNewEntry}
        onOpenUpload={reviewListCommands.openUploadModal}
      />
    </ModePanel>
  )
}
