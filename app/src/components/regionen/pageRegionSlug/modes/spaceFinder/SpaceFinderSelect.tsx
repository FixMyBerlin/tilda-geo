import { PlusIcon } from '@heroicons/react/24/outline'
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
 * Hinweise or Prüflisten. Varianten are the second level and live in their own row below the
 * header (`SpaceFinderVariantTabs`). A trailing »Neues Planungsgebiet…« row mirrors
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
        <button
          type="button"
          onClick={onNewArea}
          className="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-white/90 select-none hover:bg-white/10"
        >
          <PlusIcon className="size-4 shrink-0" aria-hidden />
          <span>Neues Planungsgebiet…</span>
        </button>
      ) : null}
    </div>
  )
}
