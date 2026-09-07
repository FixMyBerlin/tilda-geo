import { ArrowUpTrayIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useMap } from 'react-map-gl/maplibre'
import { useFeaturesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import { reviewEntriesSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/reviewEntriesLayers.const'
import { mergeModeUrlFeature } from '@/components/regionen/pageRegionSlug/Map/utils/partitionClickedFeatures'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { reviewCommentDraftId } from '../composerDrafts/composerDraftIds'
import { ComposerDraftDot } from '../composerDrafts/DraftIndicatorDot'
import { ModeDataTable } from '../ModeDataTable'
import { ModeDataTableCellsRow } from '../ModeDataTableRow'
import { modeListFilterEmptyMessage } from '../modeListFilterEmptyMessage'
import { ModeListItem } from '../ModeListItem'
import {
  modePanelBadgeClassName,
  modePanelHeaderIconButtonClassName,
  modePanelListMetaClassName,
  modePanelListTitleClassName,
  modePanelMutedClassName,
} from '../modePanel.const'
import { ModePanelEmpty } from '../ModePanelEmpty'
import { useMapExtentFilter } from '../useMapExtentFilter'
import { formatReviewEntryDataSummary } from './reviewEntryDataSummary'
import { STATUS_LABEL, type ReviewStatus } from './reviewListsModeFilters'
import { useReviewListsModeParam } from './useReviewListsModeParam'

/** First `[lng, lat]` in a GeoJSON geometry, or null if empty or malformed (those rows are skipped). */
const firstPosition = (geometry: unknown) => {
  if (!geometry || typeof geometry !== 'object' || !('coordinates' in geometry)) return null
  let coords: unknown = geometry.coordinates
  while (Array.isArray(coords) && Array.isArray(coords[0])) coords = coords[0]
  if (!Array.isArray(coords)) return null
  const [lng, lat] = coords
  if (typeof lng !== 'number' || typeof lat !== 'number') return null
  return [lng, lat] satisfies [number, number]
}

const REVIEW_TABLE_COLUMNS = [
  { id: 'id', label: '#', className: 'w-[8%]' },
  { id: 'status', label: 'Status', className: 'w-[10%]' },
  { id: 'geometry', label: 'Geometrie', className: 'w-[12%]' },
  { id: 'source', label: 'Quelle', className: 'w-[10%]' },
  { id: 'author', label: 'Autor:in', className: 'w-[14%]' },
  { id: 'comments', label: 'Kommentare', className: 'w-[10%]' },
  { id: 'data', label: 'Daten', className: 'w-[36%]' },
] as const

const ReviewStatusBadge = ({ status }: { status: ReviewStatus }) => {
  switch (status) {
    case 'PROBLEM':
      return (
        <span className="inline-block rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-800">
          {STATUS_LABEL.PROBLEM}
        </span>
      )
    case 'OK':
      return (
        <span className="inline-block rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800">
          {STATUS_LABEL.OK}
        </span>
      )
    case 'OPEN':
      return <span className={modePanelBadgeClassName}>{STATUS_LABEL.OPEN}</span>
  }
}

type ReviewListEntryFeature = {
  geometry: unknown
  properties: {
    id: number
    status: ReviewStatus
    source: string
    geometryType: string
    authorName?: string | null
    commentCount: number
    data?: unknown
  }
}

type Props = {
  features: ReviewListEntryFeature[]
  isLoading: boolean
  selectedListId: number | undefined
  canManage: boolean
  onOpenNewEntry: () => void
  onOpenUpload: (origin: HTMLElement) => void
}

/**
 * Review-list entry rows. Status/search/extent filters run here. Clicking a row selects it in `f`
 * and flies the map to the first coordinate.
 */
export const ReviewListsModeList = ({
  features,
  isLoading,
  selectedListId,
  canManage,
  onOpenNewEntry,
  onOpenUpload,
}: Props) => {
  const { mainMap } = useMap()
  const { featuresParam, setFeaturesParam } = useFeaturesParam()
  const { reviewListsMode, setReviewListsModeParam } = useReviewListsModeParam()
  const search = reviewListsMode.search ?? ''
  const extent = reviewListsMode.extent ?? 'view'
  const passesExtent = useMapExtentFilter(extent)

  const mappedEntries = features.map((feature) => ({
    feature,
    coordinates: firstPosition(feature.geometry),
  }))
  const matchingFilters = mappedEntries.filter(
    (
      entry,
    ): entry is {
      feature: (typeof features)[number]
      coordinates: [number, number]
    } => {
      if (!entry.coordinates) return false // skip empty/degenerate geometry
      const props = entry.feature.properties
      if (reviewListsMode.status && props.status !== reviewListsMode.status) return false
      if (reviewListsMode.source && props.source !== reviewListsMode.source) return false
      if (search) {
        const haystack = `${props.id} ${JSON.stringify(props.data ?? {})}`.toLowerCase()
        if (!haystack.includes(search.toLowerCase())) return false
      }
      return true
    },
  )
  const entries = matchingFilters.filter((entry) => passesExtent(entry.coordinates))

  // Match on source + id (the `f` param carries both); review entries all share the same source,
  // but this keeps the selection unambiguous if ids ever overlap across sources.
  const activeIds = new Set(
    (featuresParam ?? []).map((feature) => `${feature.sourceId}-${feature.id}`),
  )

  const selectEntry = (id: number, coordinates: [number, number]) => {
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
    mainMap?.flyTo({
      center: coordinates,
      zoom: Math.max(mainMap.getZoom(), 15),
    })
  }

  if (selectedListId === undefined) {
    return <p className={`px-4 py-3 ${modePanelMutedClassName}`}>Wählen Sie eine Prüfliste.</p>
  }
  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 px-4 py-3 ${modePanelMutedClassName}`}>
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
    if (!canManage) return <ModePanelEmpty label="Keine Einträge." />
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
                id={`review-${id}`}
                coordinates={coordinates}
                active={active}
                onClick={() => selectEntry(id, coordinates)}
              >
                <div className="relative flex items-start justify-between gap-2">
                  <span className={modePanelListTitleClassName}>Prüfeintrag #{id}</span>
                  <ReviewStatusBadge status={props.status} />
                  <ComposerDraftDot draftId={reviewCommentDraftId(id)} />
                </div>
                <div className={`mt-0.5 ${modePanelListMetaClassName}`}>
                  {props.geometryType} · {props.source === 'MANUAL' ? 'manuell' : 'Upload'}
                  {props.commentCount > 0 ? ` · ${props.commentCount} Kommentar(e)` : ''}
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
            id={`review-${id}`}
            coordinates={coordinates}
            active={active}
            onClick={() => selectEntry(id, coordinates)}
            cells={[
              <span key="id" className={`relative ${modePanelListTitleClassName}`}>
                #{id}
                <ComposerDraftDot draftId={reviewCommentDraftId(id)} />
              </span>,
              <ReviewStatusBadge key="status" status={props.status} />,
              <span key="geometry" className={modePanelListMetaClassName}>
                {props.geometryType}
              </span>,
              <span key="source" className={modePanelListMetaClassName}>
                {props.source === 'MANUAL' ? 'manuell' : 'Upload'}
              </span>,
              <span key="author" className={`line-clamp-1 ${modePanelListMetaClassName}`}>
                {props.authorName ?? '—'}
              </span>,
              <span key="comments" className={modePanelListMetaClassName}>
                {props.commentCount > 0 ? props.commentCount : '—'}
              </span>,
              <span key="data" className={`line-clamp-2 ${modePanelListMetaClassName}`}>
                {dataSummary || '—'}
              </span>,
            ]}
          />
        )
      })}
    </ModeDataTable>
  )
}
