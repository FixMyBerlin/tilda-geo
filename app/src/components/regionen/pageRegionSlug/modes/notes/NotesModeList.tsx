import { useMap } from 'react-map-gl/maplibre'
import { useFeaturesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import { mergeModeUrlFeature } from '@/components/regionen/pageRegionSlug/Map/utils/partitionClickedFeatures'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { noteCommentDraftId } from '../composerDrafts/composerDraftIds'
import { ComposerDraftDot } from '../composerDrafts/DraftIndicatorDot'
import { ModeDataTable } from '../ModeDataTable'
import { ModeDataTableCellsRow } from '../ModeDataTableRow'
import { modeListFilterEmptyMessage } from '../modeListFilterEmptyMessage'
import { ModeListItem } from '../ModeListItem'
import {
  modePanelListBodyClassName,
  modePanelListHintClassName,
  modePanelListMetaClassName,
  modePanelListTitleClassName,
  modePanelMutedClassName,
} from '../modePanel.const'
import { ModePanelEmpty } from '../ModePanelEmpty'
import { useMapExtentFilter, type ModeListExtent } from '../useMapExtentFilter'
import type { NotesModeListEntry } from './notesModeListEntry'
import type { NotesSelection } from './notesSelection'

const NOTES_TABLE_COLUMNS = [
  { id: 'title', label: 'Titel', className: 'w-[28%]' },
  { id: 'status', label: 'Status', className: 'w-[10%]' },
  { id: 'author', label: 'Autor:in', className: 'w-[16%]' },
  { id: 'comments', label: 'Kommentare', className: 'w-[10%]' },
  { id: 'preview', label: 'Vorschau', className: 'w-[36%]' },
] as const

const NoteStatusBadge = ({ status }: { status: 'open' | 'closed' }) => (
  <span
    className={
      status === 'closed'
        ? 'inline-block rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800'
        : 'inline-block rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800'
    }
  >
    {status === 'closed' ? 'erledigt' : 'offen'}
  </span>
)

type Props = {
  entries: NotesModeListEntry[]
  showingOsm: boolean
  selectionKind: NotesSelection['kind']
  isInternalLoading: boolean
  isInternalError: boolean
  isOsmError: boolean
  extent: ModeListExtent
}

/**
 * Notes mode list rows (OSM + internal). Extent filtering runs here; status/author filters are
 * applied by the parent query. Clicking a row selects it in `f` and flies the map to the pin.
 */
export const NotesModeList = ({
  entries,
  showingOsm,
  selectionKind,
  isInternalLoading,
  isInternalError,
  isOsmError,
  extent,
}: Props) => {
  const { mainMap } = useMap()
  const { featuresParam, setFeaturesParam } = useFeaturesParam()
  const passesExtent = useMapExtentFilter(extent)
  const visibleEntries = entries.filter((entry) => passesExtent(entry.coordinates))

  const activeIds = new Set(
    (featuresParam ?? []).map((feature) => `${feature.sourceId}-${feature.id}`),
  )

  const selectEntry = (entry: NotesModeListEntry) => {
    setFeaturesParam(
      mergeModeUrlFeature(featuresParam, {
        id: entry.id,
        sourceId: entry.sourceId,
        coordinates: entry.coordinates,
      }),
    )
    mainMap?.flyTo({ center: entry.coordinates, zoom: Math.max(mainMap.getZoom(), 15) })
  }

  const emptyNotes =
    entries.length > 0 && visibleEntries.length === 0 ? (
      <ModePanelEmpty
        label="Keine Hinweise für diese Filter."
        description={modeListFilterEmptyMessage({
          itemLabel: 'Hinweise',
          totalCount: entries.length,
          extentIsView: extent === 'view',
        })}
      />
    ) : (
      <ModePanelEmpty label="Keine Hinweise." />
    )

  const notesTable = (
    <ModeDataTable
      columns={[...NOTES_TABLE_COLUMNS]}
      list={
        <ul>
          {visibleEntries.map((entry) => {
            const active = activeIds.has(`${entry.sourceId}-${entry.id}`)
            return (
              <ModeListItem
                key={`${entry.sourceId}-${entry.id}`}
                id={`note-${entry.sourceId}-${entry.id}`}
                coordinates={entry.coordinates}
                active={active}
                onClick={() => selectEntry(entry)}
              >
                <div className="relative flex items-start justify-between gap-2">
                  <span className={modePanelListTitleClassName}>{entry.title}</span>
                  <NoteStatusBadge status={entry.status} />
                  {!showingOsm && <ComposerDraftDot draftId={noteCommentDraftId(entry.id)} />}
                </div>
                {entry.subtitle && (
                  <div className={`mt-0.5 ${modePanelListMetaClassName}`}>{entry.subtitle}</div>
                )}
                {entry.commentPreview && (
                  <div className={`mt-1 line-clamp-2 italic ${modePanelListBodyClassName}`}>
                    {entry.commentPreview}
                  </div>
                )}
                {entry.commentCount > 0 && (
                  <div className={`mt-0.5 ${modePanelListHintClassName}`}>
                    {entry.commentCount} Kommentar{entry.commentCount === 1 ? '' : 'e'}
                  </div>
                )}
              </ModeListItem>
            )
          })}
        </ul>
      }
    >
      {visibleEntries.map((entry) => {
        const active = activeIds.has(`${entry.sourceId}-${entry.id}`)
        return (
          <ModeDataTableCellsRow
            key={`${entry.sourceId}-${entry.id}`}
            id={`note-${entry.sourceId}-${entry.id}`}
            coordinates={entry.coordinates}
            active={active}
            onClick={() => selectEntry(entry)}
            cells={[
              <span key="title" className={`relative ${modePanelListTitleClassName}`}>
                <span className="line-clamp-2">{entry.title}</span>
                {!showingOsm && <ComposerDraftDot draftId={noteCommentDraftId(entry.id)} />}
              </span>,
              <NoteStatusBadge key="status" status={entry.status} />,
              <span key="author" className={`line-clamp-1 ${modePanelListMetaClassName}`}>
                {entry.subtitle ?? '—'}
              </span>,
              <span key="count" className={modePanelListHintClassName}>
                {entry.commentCount > 0 ? entry.commentCount : '—'}
              </span>,
              <span key="preview" className={`line-clamp-2 italic ${modePanelListBodyClassName}`}>
                {entry.commentPreview ?? '—'}
              </span>,
            ]}
          />
        )
      })}
    </ModeDataTable>
  )

  switch (selectionKind) {
    case 'none':
      return emptyNotes
    case 'internal':
      if (isInternalLoading) {
        return (
          <div className={`flex items-center gap-2 px-4 py-3 ${modePanelMutedClassName}`}>
            <SmallSpinner /> Lädt…
          </div>
        )
      }
      if (isInternalError) {
        return (
          <p className={`px-4 py-3 ${modePanelMutedClassName}`}>
            Hinweise konnten nicht geladen werden.
          </p>
        )
      }
      return visibleEntries.length === 0 ? emptyNotes : notesTable
    case 'osm':
      if (isOsmError) {
        return (
          <p className={`px-4 py-3 ${modePanelMutedClassName}`}>
            OSM-Hinweise konnten nicht geladen werden.
          </p>
        )
      }
      return visibleEntries.length === 0 ? emptyNotes : notesTable
  }
}
