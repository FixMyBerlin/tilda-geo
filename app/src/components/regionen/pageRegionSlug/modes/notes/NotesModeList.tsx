import { useMap } from 'react-map-gl/maplibre'
import { useFeaturesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import { mergeModeUrlFeature } from '@/components/regionen/pageRegionSlug/Map/utils/partitionClickedFeatures'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { noteCommentDraftId } from '../composerDrafts/composerDraftIds'
import { ComposerDraftDot } from '../composerDrafts/DraftIndicatorDot'
import { flyMapToIfOffscreen } from '../flyMapToIfOffscreen'
import { ModeDataTable } from '../ModeDataTable'
import { ModeDataTableCellsRow } from '../ModeDataTableCellsRow'
import { modeListFilterEmptyMessage } from '../modeListFilterEmptyMessage'
import { ModeListItem } from '../ModeListItem'
import {
  modePanelListBodyClassName,
  modePanelListMetaClassName,
  modePanelListTitleClassName,
  modePanelMutedClassName,
  modePanelTintHairlineBottomClassName,
} from '../modePanel.const'
import { ModePanelEmpty } from '../ModePanelEmpty'
import { ModeCommentsPill } from '../ModePanelPill'
import { useMapExtentFilter, type ModeListExtent } from '../useMapExtentFilter'
import { notesListItemId } from './notesListHoverId'
import type { NotesModeListEntry } from './notesModeListEntry'
import type { NotesSelection } from './notesSelection'
import { NotesOpenClosedIcon } from './notesStatusBadge'
import { OsmNotesLimitNotice } from './OsmNotesLimitNotice'

const NOTES_TABLE_COLUMNS = [
  { id: 'title', label: 'Titel', className: 'w-[28%]' },
  { id: 'status', label: 'Status', className: 'w-[10%]' },
  { id: 'author', label: 'Autor:in', className: 'w-[16%]' },
  { id: 'comments', label: 'Kommentare', className: 'w-[10%]' },
  { id: 'preview', label: 'Vorschau', className: 'w-[36%]' },
] as const

type Props = {
  entries: NotesModeListEntry[]
  showingOsm: boolean
  selectionKind: NotesSelection['kind']
  isInternalLoading: boolean
  isInternalError: boolean
  isOsmError: boolean
  /** TILDA notes only; OSM is always the current map bbox. */
  extent?: ModeListExtent
}

/**
 * Notes mode list rows (OSM + internal). OSM notes are the current map bbox (API cap 100).
 * Internal notes are the region collection and can be limited to the map view. Status/author
 * filters run in the parent query. Clicking a row selects it in `f` and pans if it is off-screen.
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
  const passesExtent = useMapExtentFilter(showingOsm ? 'all' : (extent ?? 'view'))
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
    flyMapToIfOffscreen(mainMap, entry.coordinates)
  }

  const emptyNotes =
    !showingOsm && entries.length > 0 && visibleEntries.length === 0 ? (
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
                id={notesListItemId(entry.sourceId, entry.id)}
                coordinates={entry.coordinates}
                active={active}
                onClick={() => selectEntry(entry)}
                className={modePanelTintHairlineBottomClassName}
                buttonClassName="px-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex min-w-0 items-center gap-1.5">
                    <NotesOpenClosedIcon
                      status={entry.status}
                      className="size-5 shrink-0 text-teal-700"
                    />
                    <span className="flex min-w-0 items-baseline gap-1.5">
                      <span className={modePanelListTitleClassName}>{entry.title}</span>
                      {entry.subtitle ? (
                        <span className={`min-w-0 truncate ${modePanelListMetaClassName}`}>
                          {entry.subtitle}
                        </span>
                      ) : null}
                      {!showingOsm && <ComposerDraftDot draftId={noteCommentDraftId(entry.id)} />}
                    </span>
                  </div>
                  <ModeCommentsPill count={entry.commentCount} />
                </div>
                {entry.commentPreview && (
                  <div
                    className={`mt-0.5 line-clamp-2 pl-6.5 italic ${modePanelListBodyClassName}`}
                  >
                    {entry.commentPreview}
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
            id={notesListItemId(entry.sourceId, entry.id)}
            coordinates={entry.coordinates}
            active={active}
            onClick={() => selectEntry(entry)}
            className={modePanelTintHairlineBottomClassName}
            cells={[
              <span key="title" className={`relative ${modePanelListTitleClassName}`}>
                <span className="line-clamp-2">{entry.title}</span>
                {!showingOsm && <ComposerDraftDot draftId={noteCommentDraftId(entry.id)} />}
              </span>,
              <NotesOpenClosedIcon key="status" status={entry.status} />,
              <span key="author" className={`line-clamp-1 ${modePanelListMetaClassName}`}>
                {entry.subtitle ?? '—'}
              </span>,
              <ModeCommentsPill key="count" count={entry.commentCount} />,
              <span key="preview" className={`line-clamp-2 italic ${modePanelListBodyClassName}`}>
                {entry.commentPreview ?? '—'}
              </span>,
            ]}
          />
        )
      })}
    </ModeDataTable>
  )

  const osmList = (
    <>
      <OsmNotesLimitNotice />
      {entries.length === 0 ? emptyNotes : notesTable}
    </>
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
      return osmList
  }
}
