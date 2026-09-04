import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { formatDate } from '@/components/shared/date/formatDate'
import {
  createPlanningVariantFn,
  deletePlanningVariantFn,
  duplicatePlanningVariantFn,
  updatePlanningVariantFn,
} from '@/server/planning/planning.functions'
import {
  planningAreasQueryOptions,
  planningVariantQueryOptions,
} from '@/server/planning/planningQueryOptions'
import {
  usePlanningAreaParam,
  usePlanningRunParam,
  usePlanningVariantParam,
} from '../hooks/useQueryState/usePlanningParams'
import { DEFAULT_FACTOR_TEMPLATE } from './planningDefaults'
import { Spinner } from './Spinner'

type VariantSummary = {
  id: number
  title: string
  currentRunId: number | null
  jobs: { status: string }[]
  runs: { hexCount: number | null; stale: boolean; status: string; createdAt: string | Date }[]
}

const StatusIcon = ({ variant }: { variant: VariantSummary }) => {
  const jobStatus = variant.jobs[0]?.status
  if (jobStatus === 'QUEUED' || jobStatus === 'RUNNING') return <Spinner />
  if (variant.currentRunId != null)
    return (
      <span className="font-bold text-green-600" title="Berechnung abgeschlossen">
        ✓
      </span>
    )
  return null
}

/** Inline-Umbenennen in der Variantenliste — Enter oder Fokusverlust speichert, Escape verwirft. */
const VariantRenameInput = ({
  variantId,
  title: savedTitle,
  regionSlug,
  onDone,
}: {
  variantId: number
  title: string
  regionSlug: string
  onDone: () => void
}) => {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(savedTitle)
  const done = useRef(false)

  const mutation = useMutation({
    mutationFn: (newTitle: string) =>
      updatePlanningVariantFn({ data: { variantId, title: newTitle } }),
    onSuccess: () => {
      queryClient.invalidateQueries(planningAreasQueryOptions(regionSlug))
      queryClient.invalidateQueries(planningVariantQueryOptions(variantId))
    },
  })

  const finish = (save: boolean) => {
    if (done.current) return
    done.current = true
    const trimmed = title.trim()
    if (save && trimmed && trimmed !== savedTitle) {
      // Liste sofort umbenennen, damit der Wechsel vom Input zurück zum Label nicht springt.
      queryClient.setQueryData(planningAreasQueryOptions(regionSlug).queryKey, (old) =>
        old?.map((area) => ({
          ...area,
          variants: area.variants.map((v) => (v.id === variantId ? { ...v, title: trimmed } : v)),
        })),
      )
      mutation.mutate(trimmed)
    }
    onDone()
  }

  return (
    <input
      type="text"
      autoFocus
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
      onClick={(e) => e.stopPropagation()}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') finish(true)
        if (e.key === 'Escape') finish(false)
      }}
      className="min-w-0 flex-1 rounded border border-blue-400 px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 focus:outline-none"
    />
  )
}

const VariantMenu = ({
  variant,
  regionSlug,
  onDeleted,
  onDuplicated,
  onRename,
}: {
  variant: VariantSummary
  regionSlug: string
  onDeleted: () => void
  onDuplicated: (variantId: number) => void
  onRename: () => void
}) => {
  const queryClient = useQueryClient()

  const duplicateMutation = useMutation({
    mutationFn: () => duplicatePlanningVariantFn({ data: { variantId: variant.id } }),
    onSuccess: (created) => {
      queryClient.invalidateQueries(planningAreasQueryOptions(regionSlug))
      queryClient.invalidateQueries(planningVariantQueryOptions(created.id))
      onDuplicated(created.id)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deletePlanningVariantFn({ data: { variantId: variant.id } }),
    onSuccess: () => {
      queryClient.invalidateQueries(planningAreasQueryOptions(regionSlug))
      onDeleted()
    },
  })

  return (
    <Menu as="div" className="relative" onClick={(e) => e.stopPropagation()}>
      <MenuButton
        type="button"
        className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        <EllipsisVerticalIcon className="size-4" />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        className="z-50 mt-0.5 w-36 rounded border border-gray-200 bg-white py-0.5 text-xs shadow-lg outline-none"
      >
        <MenuItem>
          <button
            type="button"
            onClick={() => onRename()}
            className="block w-full px-2 py-1 text-left data-focus:bg-gray-100"
          >
            Umbenennen
          </button>
        </MenuItem>
        <MenuItem>
          <button
            type="button"
            onClick={() => duplicateMutation.mutate()}
            disabled={duplicateMutation.isPending}
            className="block w-full px-2 py-1 text-left disabled:opacity-50 data-focus:bg-gray-100"
          >
            Duplizieren
          </button>
        </MenuItem>
        <MenuItem>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Variante löschen?')) deleteMutation.mutate()
            }}
            className="block w-full px-2 py-1 text-left text-red-600 data-focus:bg-red-50"
          >
            Löschen
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  )
}

/** A/B variant switcher for the active planungsgebiet. */
export const VariantList = ({ regionSlug }: { regionSlug: string }) => {
  const [activeArea] = usePlanningAreaParam()
  const [activeVariant, setActiveVariant] = usePlanningVariantParam()
  const [, setRun] = usePlanningRunParam()
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const queryClient = useQueryClient()

  const { data: areas } = useQuery({
    ...planningAreasQueryOptions(regionSlug),
    refetchInterval: (query) => {
      const area = query.state.data?.find((a) => a.id === activeArea)
      const hasInFlight = area?.variants.some(
        (v) => v.jobs[0]?.status === 'QUEUED' || v.jobs[0]?.status === 'RUNNING',
      )
      return hasInFlight ? 2000 : false
    },
  })

  const area = areas?.find((a) => a.id === activeArea)
  const variants = area?.variants ?? []

  const duplicateMutation = useMutation({
    mutationFn: (variantId: number) => duplicatePlanningVariantFn({ data: { variantId } }),
    onSuccess: (created) => {
      queryClient.invalidateQueries(planningAreasQueryOptions(regionSlug))
      setActiveVariant(created.id)
      setRun(null)
    },
  })

  const createMutation = useMutation({
    mutationFn: () =>
      createPlanningVariantFn({
        data: {
          areaId: activeArea!,
          factorConfig: DEFAULT_FACTOR_TEMPLATE,
        },
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries(planningAreasQueryOptions(regionSlug))
      queryClient.invalidateQueries(planningVariantQueryOptions(created.id))
      setActiveVariant(created.id)
    },
  })

  if (activeArea == null) {
    return null
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Varianten</div>
      {variants.length === 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-500">Noch keine Varianten.</p>
          <button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="rounded border border-gray-300 px-2 py-1.5 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Wird angelegt…' : '+ Variante anlegen'}
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {variants.map((variant) => {
            const latestRun = variant.runs[0]
            const isStale = latestRun?.stale === true
            return (
              <li key={variant.id} className="flex items-center gap-1">
                {renamingId === variant.id ? (
                  <VariantRenameInput
                    variantId={variant.id}
                    title={variant.title}
                    regionSlug={regionSlug}
                    onDone={() => setRenamingId(null)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveVariant(variant.id)
                      setRun(variant.currentRunId ?? null)
                    }}
                    className={`flex min-w-0 flex-1 items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-gray-100 ${
                      activeVariant === variant.id ? 'bg-blue-50 font-medium' : ''
                    }`}
                  >
                    <span className="w-4 shrink-0 text-center">
                      {activeVariant === variant.id ? '●' : '○'}
                    </span>
                    <span className="w-4 shrink-0 text-center">
                      <StatusIcon variant={variant} />
                    </span>
                    <span className="truncate">{variant.title}</span>
                    {latestRun?.status === 'COMPLETE' && (
                      <span className="shrink-0 text-xs text-gray-400 tabular-nums">
                        {formatDate(latestRun.createdAt)}
                      </span>
                    )}
                    {isStale && (
                      <span className="shrink-0 rounded bg-amber-100 px-1 text-[10px] text-amber-800">
                        veraltet
                      </span>
                    )}
                  </button>
                )}
                <VariantMenu
                  variant={variant}
                  regionSlug={regionSlug}
                  onRename={() => setRenamingId(variant.id)}
                  onDuplicated={(id) => {
                    setActiveVariant(id)
                    setRun(null)
                  }}
                  onDeleted={() => {
                    if (activeVariant === variant.id) {
                      setActiveVariant(null)
                      setRun(null)
                    }
                  }}
                />
              </li>
            )
          })}
        </ul>
      )}

      {activeVariant != null && (
        <button
          type="button"
          onClick={() => duplicateMutation.mutate(activeVariant)}
          disabled={duplicateMutation.isPending}
          className="rounded border border-gray-300 px-2 py-1.5 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
        >
          {duplicateMutation.isPending ? 'Wird dupliziert…' : '+ Variante duplizieren'}
        </button>
      )}
    </div>
  )
}
