import { ModeFilterBar } from '../ModeFilterBar'
import { ModeFilterSelect, modeFilterIcons } from '../ModeFilterSelect'
import {
  NOTES_COMMENTED_FILTER_OPTIONS,
  NOTES_REACTION_FILTER_OPTIONS,
  NOTES_STATUS_FILTER_OPTIONS,
  notesCommentedFilterValue,
  notesReactionFilterValue,
  notesStatusFilterValue,
} from './notesModeFilters'
import type { NotesModeParam } from './notesModeParam'

type Props = {
  notesMode: NotesModeParam
  setNotesModeParam: (next: NotesModeParam) => void
  showReactionFilter: boolean
  /** TILDA notes can filter by map view; OSM notes are already the bbox. */
  showExtentFilter: boolean
  authorOptions: { value: string; label: string }[]
}

export const NotesModeFilterBar = ({
  notesMode,
  setNotesModeParam,
  showReactionFilter,
  showExtentFilter,
  authorOptions,
}: Props) => {
  const search = notesMode.search ?? ''
  const updateFilter = (patch: Partial<NotesModeParam>) =>
    setNotesModeParam({ ...notesMode, ...patch })

  return (
    <ModeFilterBar
      search={search}
      onSearchChange={(query) => updateFilter({ search: query || undefined })}
      searchPlaceholder="Hinweise durchsuchen…"
      extent={showExtentFilter ? (notesMode.extent ?? 'view') : undefined}
      onExtentChange={showExtentFilter ? (next) => updateFilter({ extent: next }) : undefined}
    >
      <ModeFilterSelect
        label="Status"
        icon={modeFilterIcons.status}
        value={notesStatusFilterValue(notesMode.completed)}
        options={NOTES_STATUS_FILTER_OPTIONS}
        onChange={(value) =>
          updateFilter({
            completed: value === 'all' ? undefined : value === 'closed',
          })
        }
      />
      <ModeFilterSelect
        label="Kommentare"
        icon={modeFilterIcons.comments}
        value={notesCommentedFilterValue(notesMode.commented)}
        options={NOTES_COMMENTED_FILTER_OPTIONS}
        onChange={(value) =>
          updateFilter({
            commented: value === 'all' ? undefined : value === 'yes',
          })
        }
      />
      {showReactionFilter ? (
        <ModeFilterSelect
          label="Reaktion"
          icon={modeFilterIcons.reaction}
          value={notesReactionFilterValue(notesMode.notReacted)}
          options={NOTES_REACTION_FILTER_OPTIONS}
          onChange={(value) =>
            updateFilter({
              notReacted: value === 'all' ? undefined : value === 'notReacted',
            })
          }
        />
      ) : null}
      <ModeFilterSelect
        label="Autor:in"
        icon={modeFilterIcons.author}
        value={notesMode.user ?? ''}
        options={authorOptions}
        onChange={(value) => updateFilter({ user: value || undefined })}
      />
    </ModeFilterBar>
  )
}
