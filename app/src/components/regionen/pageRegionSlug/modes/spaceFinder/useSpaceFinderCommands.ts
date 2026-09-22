import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { captureModalOpenOrigin } from '@/components/shared/motion/modalOpenOrigin'
import type { getPlanningAreasFn } from '@/server/planning/planning.functions'
import {
  deletePlanningAreaFn,
  deletePlanningVariantFn,
  duplicatePlanningVariantFn,
  updatePlanningAreaFn,
  updatePlanningVariantFn,
} from '@/server/planning/planning.functions'
import {
  planningAreaQueryOptions,
  planningAreasQueryOptions,
  planningVariantQueryOptions,
} from '@/server/planning/planningQueryOptions'
import {
  spaceFinderCollectionOptions,
  type SpaceFinderCollectionOption,
} from './spaceFinderCollectionOptions'

type PlanningAreasRow = Awaited<ReturnType<typeof getPlanningAreasFn>>[number]

type UseSpaceFinderCommandsInput = {
  regionSlug: string
  areas: readonly PlanningAreasRow[]
  selectedOption: SpaceFinderCollectionOption | undefined
  /** Writes `ff.key`. `undefined` clears the selection (e.g. the last Gebiet was deleted). */
  onSelect: (variantId: number | undefined) => void
}

/**
 * Variante/Gebiet create/rename/duplicate/delete commands for the header ➕/⋯ menus, mirroring
 * `useReviewListCommands`. Unlike Prüflisten's single collection entity, this manages two levels
 * (D4): the ⋯ menu's »Variante« block acts on `selectedOption`, its »Gebiet« block on
 * `selectedOption.areaId`. Creation (»Neue Variante«/»Neues Planungsgebiet«) is not here — those
 * open a ModePanel detail view (`ff.new`) with their own forms/wizard.
 */
export const useSpaceFinderCommands = ({
  regionSlug,
  areas,
  selectedOption,
  onSelect,
}: UseSpaceFinderCommandsInput) => {
  const queryClient = useQueryClient()
  const [nameModal, setNameModal] = useState<'renameVariant' | 'renameArea' | null>(null)

  const openNameModal = (kind: 'renameVariant' | 'renameArea', origin?: HTMLElement) => {
    if (origin) captureModalOpenOrigin(origin)
    setNameModal(kind)
  }
  const closeNameModal = () => setNameModal(null)

  const invalidateAreas = () => queryClient.invalidateQueries(planningAreasQueryOptions(regionSlug))

  const renameVariant = useMutation({
    mutationFn: (title: string) => {
      if (!selectedOption) throw new Error('Keine Variante ausgewählt.')
      return updatePlanningVariantFn({ data: { variantId: selectedOption.variantId, title } })
    },
    onSuccess: async () => {
      await invalidateAreas()
      if (selectedOption) {
        await queryClient.invalidateQueries(planningVariantQueryOptions(selectedOption.variantId))
      }
    },
  })

  const renameArea = useMutation({
    mutationFn: (title: string) => {
      if (!selectedOption) throw new Error('Kein Planungsgebiet ausgewählt.')
      return updatePlanningAreaFn({
        data: { areaId: selectedOption.areaId, title, userGeojson: undefined },
      })
    },
    onSuccess: async () => {
      await invalidateAreas()
      if (selectedOption) {
        await queryClient.invalidateQueries(planningAreaQueryOptions(selectedOption.areaId))
      }
    },
  })

  const duplicateVariant = useMutation({
    mutationFn: (variantId: number) => duplicatePlanningVariantFn({ data: { variantId } }),
    onSuccess: async (created) => {
      await invalidateAreas()
      await queryClient.invalidateQueries(planningVariantQueryOptions(created.id))
      onSelect(created.id)
    },
  })

  const deleteVariant = useMutation({
    mutationFn: (variantId: number) => deletePlanningVariantFn({ data: { variantId } }),
    onSuccess: async (_result, variantId) => {
      await invalidateAreas()
      if (selectedOption?.variantId !== variantId) return
      const area = areas.find((a) => a.id === selectedOption.areaId)
      const remaining = area?.variants.filter((v) => v.id !== variantId) ?? []
      onSelect(remaining[0]?.id)
    },
  })

  const deleteArea = useMutation({
    mutationFn: (areaId: number) => deletePlanningAreaFn({ data: { areaId } }),
    onSuccess: async (_result, areaId) => {
      await invalidateAreas()
      if (selectedOption?.areaId !== areaId) return
      const remainingOptions = spaceFinderCollectionOptions(areas.filter((a) => a.id !== areaId))
      onSelect(remainingOptions[0]?.variantId)
    },
  })

  return {
    nameModal,
    openNameModal,
    closeNameModal,
    renameVariant,
    renameArea,
    duplicateVariant,
    deleteVariant,
    deleteArea,
  }
}

export type SpaceFinderCommands = ReturnType<typeof useSpaceFinderCommands>
