import { ModeCollectionActionRow } from '../ModeCollectionActionRow'
import { ModeCollectionSelect } from '../ModeCollectionSelect'
import type { PlanningAreasRow } from './spaceFinderCollectionOptions'

type Props = {
  /** Already sorted oldest first (`sortedSpaceFinderAreas`). */
  areas: PlanningAreasRow[]
  selectedAreaId: number | undefined
  onSelectArea: (areaId: number) => void
  /** Desktop only (D10) — opens the »Neues Planungsgebiet« detail view. */
  onNewArea?: () => void
}

const variantCountLabel = (count: number) => (count === 1 ? '1 Variante' : `${count} Varianten`)

/**
 * Planungsgebiete for the mode header disclosure — the Flächenfinder's collection, like Ordner in
 * Hinweise or Prüflisten. Varianten are the second level, a dropdown bar of their own directly
 * below the header (`SpaceFinderVariantSelect`). A trailing »Neues Planungsgebiet…« row mirrors
 * »Neuer Ordner…«.
 */
export const SpaceFinderSelect = ({ areas, selectedAreaId, onSelectArea, onNewArea }: Props) => {
  return (
    <div className="flex flex-col gap-1">
      {areas.length > 0 ? (
        <ModeCollectionSelect
          aria-label="Planungsgebiet"
          value={String(selectedAreaId ?? areas[0]?.id ?? '')}
          options={areas.map((area) => ({
            value: String(area.id),
            label: area.title,
            description: variantCountLabel(area.variants.length),
            private: true,
          }))}
          onChange={(next) => onSelectArea(Number(next))}
        />
      ) : (
        <p className="px-2 py-1.5 text-sm text-white/90">Noch kein Planungsgebiet angelegt.</p>
      )}
      {onNewArea ? (
        <ModeCollectionActionRow onClick={onNewArea}>Neues Planungsgebiet…</ModeCollectionActionRow>
      ) : null}
    </div>
  )
}
