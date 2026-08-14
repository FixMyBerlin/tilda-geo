import { ChevronDownIcon, PencilSquareIcon } from '@heroicons/react/20/solid'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { planningAreasQueryOptions } from '@/server/planning/planningQueryOptions'
import {
  usePlanningAreaParam,
  usePlanningRunParam,
  usePlanningVariantParam,
} from '../hooks/useQueryState/usePlanningParams'
import { AreaEditor } from './AreaEditor'
import { AreaWizard } from './AreaWizard'

/** Dropdown in the context bar: switch planungsgebiet or create a new one. */
export const AreaContextBar = ({
  regionSlug,
  onCreatingChange,
}: {
  regionSlug: string
  onCreatingChange?: (creating: boolean) => void
}) => {
  const [activeArea, setActiveArea] = usePlanningAreaParam()
  const [activeVariant, setActiveVariant] = usePlanningVariantParam()
  const [, setRun] = usePlanningRunParam()
  const [open, setOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState(false)

  const setCreating = (creating: boolean) => {
    setShowCreate(creating)
    onCreatingChange?.(creating)
  }

  const { data: areas } = useQuery(planningAreasQueryOptions(regionSlug))
  const current = areas?.find((a) => a.id === activeArea)

  // Auto-select first area + variant when entering planning mode without URL state.
  useEffect(() => {
    if (!areas?.length || activeArea != null) return
    if (activeVariant != null) return
    const first = areas[0]!
    setActiveArea(first.id)
    if (first.variants[0]?.id != null) setActiveVariant(first.variants[0].id)
  }, [areas, activeArea, activeVariant, setActiveArea, setActiveVariant])

  const selectArea = (areaId: number, firstVariantId?: number) => {
    setActiveArea(areaId)
    if (firstVariantId != null) setActiveVariant(firstVariantId)
    else setActiveVariant(null)
    setRun(null)
    setOpen(false)
    setCreating(false)
    setEditing(false)
  }

  if (showCreate) {
    return (
      <AreaWizard
        regionSlug={regionSlug}
        onCreated={(areaId, variantId) => {
          setCreating(false)
          setActiveArea(areaId)
          setActiveVariant(variantId)
        }}
        onCancel={() => setCreating(false)}
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
        onClick={() => setCreating(true)}
        className="rounded border border-gray-300 px-2 py-1.5 text-sm font-medium hover:bg-gray-100"
      >
        + Planungsgebiet anlegen
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 border-b border-gray-200 pb-2 text-sm">
      <span className="shrink-0 text-xs text-gray-500">Planungsgebiet:</span>
      <div className="relative min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-1 rounded border border-gray-200 px-2 py-1 text-left hover:bg-gray-50"
        >
          <span className="truncate font-medium">{current?.title ?? '—'}</span>
          <ChevronDownIcon className="size-4 shrink-0 text-gray-400" />
        </button>
        {open && (
          <ul className="absolute top-full right-0 left-0 z-10 mt-0.5 max-h-48 overflow-auto rounded border border-gray-200 bg-white shadow-lg">
            {(areas ?? []).map((area) => (
              <li key={area.id}>
                <button
                  type="button"
                  onClick={() => selectArea(area.id, area.variants[0]?.id)}
                  className={`block w-full truncate px-2 py-1.5 text-left text-sm hover:bg-gray-100 ${
                    area.id === activeArea ? 'bg-blue-50 font-medium' : ''
                  }`}
                >
                  {area.title}
                </button>
              </li>
            ))}
            <li className="border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setCreating(true)
                }}
                className="block w-full px-2 py-1.5 text-left text-sm text-blue-700 hover:bg-blue-50"
              >
                + Neues Planungsgebiet
              </button>
            </li>
          </ul>
        )}
      </div>
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
