import { ArrowUpTrayIcon, PlusIcon } from '@heroicons/react/24/outline'
import { bbox } from '@turf/turf'
import type { Geometry } from 'geojson'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import { useFeaturesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import { reviewEntriesSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/reviewEntriesLayers.const'
import { mergeModeUrlFeature } from '@/components/regionen/pageRegionSlug/Map/utils/partitionClickedFeatures'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import {
  type ReviewListStatusStyles,
  type ReviewStatus,
  readableTextColor,
} from '@/shared/reviewLists/reviewListStatusStyles'
import { reviewCommentDraftId } from '../composerDrafts/composerDraftIds'
import { ComposerDraftDot } from '../composerDrafts/DraftIndicatorDot'
import { flyMapToIfOffscreen } from '../flyMapToIfOffscreen'
import { ModeDataTable } from '../ModeDataTable'
import { ModeDataTableCellsRow } from '../ModeDataTableCellsRow'
import { modeListFilterEmptyMessage } from '../modeListFilterEmptyMessage'
import { ModeListItem } from '../ModeListItem'
import { reviewListItemId } from '../modeListItemId'
import {
  modePanelHeaderIconButtonClassName,
  modePanelListMetaClassName,
  modePanelListTitleClassName,
  modePanelMutedClassName,
} from '../modePanel.const'
import { ModePanelEmpty } from '../ModePanelEmpty'
import { ModeCommentsPill, ModePanelPill } from '../ModePanelPill'
import { formatReviewEntryDataSummary } from './reviewEntryDataSummary'
import { useReviewListEntries } from './useReviewListEntries'
import { useReviewListsModeParam } from './useReviewListsModeParam'
import { useReviewListStatusStyles } from './useReviewListStatusStyles'

const REVIEW_TABLE_COLUMNS = [
  { id: 'id', label: '#', className: 'w-[8%]' },
  { id: 'status', label: 'Status', className: 'w-[10%]' },
  { id: 'source', label: 'Quelle', className: 'w-[12%]' },
  { id: 'author', label: 'Autor:in', className: 'w-[16%]' },
  { id: 'comments', label: 'Kommentare', className: 'w-[10%]' },
  { id: 'data', label: 'Daten', className: 'w-[44%]' },
] as const

const ReviewStatusBadge = ({ style }: { style: ReviewListStatusStyles[ReviewStatus] }) => (
  <ModePanelPill backgroundColor={style.color} style={{ color: readableTextColor(style.color) }}>
    {style.label}
  </ModePanelPill>
)

type Props = {
  onOpenNewEntry: () => void
  onOpenUpload: (origin: HTMLElement) => void
}

/**
 * Review-list entry rows. Entries and filters come from `useReviewListEntries`. Clicking a row selects it in `f`
 * and pans if it is off-screen (zoom unchanged).
 */
export const ReviewListsModeList = ({ onOpenNewEntry, onOpenUpload }: Props) => {
  const { mainMap } = useMap()
  const { featuresParam, setFeaturesParam } = useFeaturesParam()
  const { reviewListsMode, setReviewListsModeParam } = useReviewListsModeParam()
  const statusStyles = useReviewListStatusStyles()
  const extent = reviewListsMode.extent ?? 'view'
  const { selectedListId, isLoading, features, matchingFilters, entries } = useReviewListEntries()

  // Match on source + id (the `f` param carries both); review entries all share the same source,
  // but this keeps the selection unambiguous if ids ever overlap across sources.
  const activeIds = new Set(
    (featuresParam ?? []).map((feature) => `${feature.sourceId}-${feature.id}`),
  )

  const selectEntry = (id: number, coordinates: [number, number], geometry: Geometry) => {
    setFeaturesParam(
      mergeModeUrlFeature(featuresParam, {
        id,
        sourceId: reviewEntriesSourceId,
        coordinates,
      }),
    )
    setReviewListsModeParam({
      ...reviewListsMode,
      move: undefined,
    })
    const [minLng, minLat, maxLng, maxLat] = bbox(geometry)
    flyMapToIfOffscreen(mainMap, [minLng, minLat, maxLng, maxLat])
  }

  if (selectedListId === undefined) {
    return (
      <p className={twJoin('px-4 py-3', modePanelMutedClassName)}>Wählen Sie eine Prüfliste.</p>
    )
  }
  if (isLoading) {
    return (
      <div className={twJoin('flex items-center gap-2 px-4 py-3', modePanelMutedClassName)}>
        <SmallSpinner /> Lädt…
      </div>
    )
  }
  if (entries.length === 0 && features.length > 0) {
    return (
      <ModePanelEmpty
        label="Keine Einträge für diese Filter."
        description={modeListFilterEmptyMessage({
          itemLabel: 'Einträge',
          totalCount: features.length,
          extentIsView: extent === 'view' && matchingFilters.length > 0,
        })}
      />
    )
  }
  if (entries.length === 0) {
    return (
      <div className="flex flex-col gap-3 px-4 py-4" role="status">
        <div className="flex items-center justify-between gap-3">
          <p className={modePanelMutedClassName}>Ersten Eintrag manuell hinzufügen</p>
          <button
            type="button"
            onClick={onOpenNewEntry}
            aria-label="Neuer Eintrag"
            className={modePanelHeaderIconButtonClassName}
          >
            <PlusIcon className="size-5" aria-hidden />
          </button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className={modePanelMutedClassName}>GeoJSON mit Einträgen hochladen</p>
          <button
            type="button"
            onClick={(event) => onOpenUpload(event.currentTarget)}
            aria-label="GeoJSON hochladen"
            className={modePanelHeaderIconButtonClassName}
          >
            <ArrowUpTrayIcon className="size-5" aria-hidden />
          </button>
        </div>
      </div>
    )
  }

  return (
    <ModeDataTable
      columns={[...REVIEW_TABLE_COLUMNS]}
      list={
        <ul>
          {entries.map(({ feature, coordinates }) => {
            const props = feature.properties
            const id = Number(props.id)
            const active = activeIds.has(`${reviewEntriesSourceId}-${id}`)
            return (
              <ModeListItem
                key={id}
                id={reviewListItemId(id)}
                coordinates={coordinates}
                active={active}
                onClick={() => selectEntry(id, coordinates, feature.geometry)}
              >
                <div className="relative flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-baseline gap-1.5">
                    <span
                      className={twJoin('shrink-0 whitespace-nowrap', modePanelListTitleClassName)}
                    >
                      Prüfeintrag #{id}
                    </span>
                    {props.authorName ? (
                      <span className={twJoin('min-w-0 truncate', modePanelListMetaClassName)}>
                        {props.authorName}
                      </span>
                    ) : null}
                    <ComposerDraftDot draftId={reviewCommentDraftId(id)} />
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <ReviewStatusBadge style={statusStyles[props.status]} />
                    <ModeCommentsPill count={props.commentCount} />
                  </span>
                </div>
                <div className={twJoin('mt-0.5', modePanelListMetaClassName)}>
                  {props.source === 'MANUAL' ? 'manuell' : 'Upload'}
                </div>
              </ModeListItem>
            )
          })}
        </ul>
      }
    >
      {entries.map(({ feature, coordinates }) => {
        const props = feature.properties
        const id = Number(props.id)
        const active = activeIds.has(`${reviewEntriesSourceId}-${id}`)
        const dataSummary = formatReviewEntryDataSummary(props.data)
        return (
          <ModeDataTableCellsRow
            key={id}
            id={reviewListItemId(id)}
            coordinates={coordinates}
            active={active}
            onClick={() => selectEntry(id, coordinates, feature.geometry)}
            cells={[
              <span key="id" className={twJoin('relative', modePanelListTitleClassName)}>
                #{id}
                <ComposerDraftDot draftId={reviewCommentDraftId(id)} />
              </span>,
              <ReviewStatusBadge key="status" style={statusStyles[props.status]} />,
              <span key="source" className={modePanelListMetaClassName}>
                {props.source === 'MANUAL' ? 'manuell' : 'Upload'}
              </span>,
              <span key="author" className={twJoin('line-clamp-1', modePanelListMetaClassName)}>
                {props.authorName ?? '—'}
              </span>,
              <ModeCommentsPill key="comments" count={props.commentCount} />,
              <span key="data" className={twJoin('line-clamp-2', modePanelListMetaClassName)}>
                {dataSummary || '—'}
              </span>,
            ]}
          />
        )
      })}
    </ModeDataTable>
  )
}
