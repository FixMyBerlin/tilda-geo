import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { ChevronDownIcon, PencilSquareIcon } from '@heroicons/react/20/solid'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { planningAreasQueryOptions } from '@/server/planning/planningQueryOptions'
import { usePlanningBoundaryState } from '../hooks/mapState/usePlanningBoundaryState'
import {
  usePlanningAreaParam,
  usePlanningVariantParam,
  useSetPlanningSelection,
} from '../hooks/useQueryState/usePlanningParams'
import { AreaEditor } from './AreaEditor'
import { AreaWizard } from './AreaWizard'

/** Dropdown in the context bar: switch planungsgebiet or create a new one. */
export const AreaContextBar = ({
  regionSlug,
  creating,
  pendingCreatedAreaId,
  onShowCreate,
  onPendingCreatedAreaId,
}: {
  regionSlug: string
  creating: boolean
  pendingCreatedAreaId: number | null
  onShowCreate: (show: boolean) => void
  onPendingCreatedAreaId: (areaId: number | null) => void
}) => {
  const [activeArea] = usePlanningAreaParam()
  const [activeVariant] = usePlanningVariantParam()
  const setPlanningSelection = useSetPlanningSelection()
  const setBoundaryHighlightGeom = usePlanningBoundaryState((s) => s.setBoundaryHighlightGeom)
  const setLastFittedBoundaryKey = usePlanningBoundaryState((s) => s.setLastFittedBoundaryKey)
  const [editing, setEditing] = useState(false)

  const startCreate = () => {
    // Keep area/variant in the URL so Cancel remounts the previous variant.
    // Only hide run overlays and the old outline while the wizard owns the map.
    setPlanningSelection({
      area: activeArea ?? null,
      variant: activeVariant ?? null,
      run: null,
    })
    setBoundaryHighlightGeom(null)
    onShowCreate(true)
  }

  const { data: areas } = useQuery(planningAreasQueryOptions(regionSlug))
  const current = areas?.find((a) => a.id === activeArea)

  // Auto-select first area when entering planning without URL state, or when the
  // URL still points at a deleted (orphaned) planungsgebiet.
  useEffect(
    function selectFirstAreaWhenOrphaned() {
      if (pendingCreatedAreaId != null) return
      if (!areas?.length) return
      const activeStillExists = activeArea != null && areas.some((a) => a.id === activeArea)
      if (activeStillExists) return
      // Legacy shared links may only have planningVariant — let PlanningPanel resolve the area.
      if (activeArea == null && activeVariant != null) return
      const first = areas[0]!
      const firstVariant = first.variants[0]
      setPlanningSelection({
        area: first.id,
        variant: firstVariant?.id ?? null,
        run: firstVariant?.currentRunId ?? null,
      })
    },
    [areas, activeArea, activeVariant, pendingCreatedAreaId, setPlanningSelection],
  )

  const selectArea = (
    areaId: number,
    firstVariant?: { id: number; currentRunId: number | null },
  ) => {
    setPlanningSelection({
      area: areaId,
      variant: firstVariant?.id ?? null,
      run: firstVariant?.currentRunId ?? null,
    })
    onShowCreate(false)
    onPendingCreatedAreaId(null)
    setEditing(false)
  }

  if (creating) {
    return (
      <AreaWizard
        regionSlug={regionSlug}
        onCreated={(areaId, variantId) => {
          setLastFittedBoundaryKey(null)
          setPlanningSelection({ area: areaId, variant: variantId, run: null })
          onShowCreate(false)
          onPendingCreatedAreaId(areaId)
        }}
        onCancel={() => {
          onPendingCreatedAreaId(null)
          onShowCreate(false)
        }}
      />
    )
  }

  if (editing && activeArea != null) {
    return (
      <AreaEditor
        areaId={activeArea}
        regionSlug={regionSlug}
        onClose={() => setEditing(false)}
        onDeleted={() => setEditing(false)}
      />
    )
  }

  if (areas !== undefined && areas.length === 0) {
    return (
      <button
        type="button"
        onClick={startCreate}
        className="rounded border border-gray-300 px-2 py-1.5 text-sm font-medium hover:bg-gray-100"
      >
        + Planungsgebiet anlegen
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 border-b border-gray-200 pb-2 text-sm">
      <span className="shrink-0 text-xs text-gray-500">Planungsgebiet:</span>
      <Listbox
        as="div"
        className="relative min-w-0 flex-1"
        value={activeArea ?? undefined}
        onChange={(areaId) => {
          const area = areas?.find((a) => a.id === areaId)
          selectArea(areaId, area?.variants[0])
        }}
      >
        <ListboxButton className="flex w-full items-center gap-1 rounded border border-gray-200 px-2 py-1 text-left hover:bg-gray-50">
          <span className="truncate font-medium">{current?.title ?? '—'}</span>
          <ChevronDownIcon className="size-4 shrink-0 text-gray-400" />
        </ListboxButton>
        <ListboxOptions
          anchor="bottom start"
          className="z-50 max-h-48 w-[var(--button-width)] overflow-auto rounded border border-gray-200 bg-white text-sm shadow-lg"
        >
          {(areas ?? []).map((area) => (
            <ListboxOption
              key={area.id}
              value={area.id}
              className={({ focus, selected }) =>
                `block w-full cursor-pointer truncate px-2 py-1.5 text-left ${
                  focus ? 'bg-gray-100' : ''
                } ${selected ? 'bg-blue-50 font-medium' : ''}`
              }
            >
              {area.title}
            </ListboxOption>
          ))}
          <div className="border-t border-gray-100">
            <button
              type="button"
              onClick={startCreate}
              className="block w-full px-2 py-1.5 text-left text-blue-700 hover:bg-blue-50"
            >
              + Neues Planungsgebiet
            </button>
          </div>
        </ListboxOptions>
      </Listbox>
      {activeArea != null && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Planungsgebiet bearbeiten"
          className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        >
          <PencilSquareIcon className="size-4" />
        </button>
      )}
    </div>
  )
}
