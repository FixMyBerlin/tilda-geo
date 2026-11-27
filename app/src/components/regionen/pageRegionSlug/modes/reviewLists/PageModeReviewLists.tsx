import { PlusIcon } from '@heroicons/react/24/outline'
import { useMapActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useFeaturesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { frenchQuote } from '@/components/shared/text/Quotes'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import { ModeFilterBar } from '../ModeFilterBar'
import { ModeFilterSelect, modeFilterIcons } from '../ModeFilterSelect'
import { ModePanel } from '../ModePanel'
import { modePanelHeaderIconButtonClassName } from '../modePanel.const'
import { sharedWithRegionsSubtitle } from '../sharedWithRegions'
import { useModeDetailSelection } from '../useModeDetailSelection'
import { ReviewEntryDetail } from './detail/ReviewEntryDetail'
import { ReviewEntryDetailActions } from './detail/ReviewEntryDetailActions'
import { ReviewEntryNew } from './new/ReviewEntryNew'
import { ReviewListManageMenu, ReviewListSelect } from './ReviewListSelect'
import { reviewStatusFilterOptions } from './reviewListsModeFilters'
import { ReviewListsModeList } from './ReviewListsModeList'
import { ReviewListsModeListCount } from './ReviewListsModeListCount'
import { useReviewListCommands } from './useReviewListCommands'
import { useReviewListsModeParam } from './useReviewListsModeParam'
import { useReviewListStatusStyles } from './useReviewListStatusStyles'
import { useSelectedReviewList } from './useSelectedReviewList'

export const PageModeReviewLists = () => {
  const region = useRegion()
  const { setFeaturesParam } = useFeaturesParam()
  const { clearInspectorFeatures } = useMapActions()
  const { selected, clearModeDetail } = useModeDetailSelection()
  const { reviewListsMode, setReviewListsModeParam } = useReviewListsModeParam()

  const { lists, selectedListId, selectedList } = useSelectedReviewList()
  const statusStyles = useReviewListStatusStyles()

  const search = reviewListsMode.search ?? ''
  const extent = reviewListsMode.extent ?? 'view'

  const updateFilter = (patch: Partial<typeof reviewListsMode>) =>
    setReviewListsModeParam({ ...reviewListsMode, ...patch })

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
    onDeleted: () =>
      setReviewListsModeParam({ ...reviewListsMode, key: undefined, move: undefined }),
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
      subtitle={
        !panelDetail
          ? sharedWithRegionsSubtitle('Liste', selectedList?.regions, region.slug)
          : undefined
      }
      detail={panelDetail}
      collectionAlwaysOpen={lists.length === 0}
      collection={
        <ReviewListSelect
          lists={lists}
          selectedListId={selectedListId}
          currentRegionSlug={region.slug}
          onSelect={onSelectList}
          commands={reviewListCommands}
        />
      }
      actions={
        composeDetail ? undefined : reviewDetail &&
          selectedEntryId !== undefined &&
          selectedListId !== undefined ? (
          <ReviewEntryDetailActions entryId={selectedEntryId} listId={selectedListId} />
        ) : lists.length === 0 ? (
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
        ) : (
          <>
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
            <ReviewListManageMenu
              regionSlug={region.slug}
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
          countLabel={<ReviewListsModeListCount />}
          extent={extent}
          onExtentChange={(next) => setReviewListsModeParam({ ...reviewListsMode, extent: next })}
        >
          <ModeFilterSelect
            label="Status"
            icon={modeFilterIcons.status}
            value={reviewListsMode.status ?? 'all'}
            options={reviewStatusFilterOptions(statusStyles)}
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
        onOpenNewEntry={openNewEntry}
        onOpenUpload={reviewListCommands.openUploadModal}
      />
    </ModePanel>
  )
}
