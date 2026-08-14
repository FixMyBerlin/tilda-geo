import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { updatePlanningVariantFn } from '@/server/planning/planning.functions'
import {
  planningAreasQueryOptions,
  planningVariantQueryOptions,
} from '@/server/planning/planningQueryOptions'
import { planningPanelTitleInputClass } from './planningPanelStyles'

type VariantTitleFieldProps = {
  variantId: number
  title: string
  regionSlug: string
  readOnly?: boolean
}

const VariantTitleFieldForm = ({
  variantId,
  title: savedTitle,
  regionSlug,
  readOnly = false,
}: VariantTitleFieldProps) => {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(savedTitle)
  const lastSaved = useRef(savedTitle)

  const patchListTitle = (newTitle: string) => {
    queryClient.setQueryData(planningAreasQueryOptions(regionSlug).queryKey, (old) => {
      if (!old) return old
      return old.map((area) => ({
        ...area,
        variants: area.variants.map((v) => (v.id === variantId ? { ...v, title: newTitle } : v)),
      }))
    })
  }

  const mutation = useMutation({
    mutationFn: (newTitle: string) =>
      updatePlanningVariantFn({ data: { variantId, title: newTitle } }),
    onSuccess: (_, newTitle) => {
      lastSaved.current = newTitle
      queryClient.invalidateQueries(planningAreasQueryOptions(regionSlug))
      queryClient.invalidateQueries(planningVariantQueryOptions(variantId))
    },
  })

  const saveTitle = () => {
    const trimmed = title.trim()
    if (!trimmed || trimmed === lastSaved.current) return
    mutation.mutate(trimmed)
  }

  return (
    <label className="flex flex-col gap-1 text-sm text-gray-700">
      Name der Variante
      <input
        type="text"
        value={title}
        disabled={readOnly}
        onChange={(e) => {
          setTitle(e.target.value)
          patchListTitle(e.target.value)
        }}
        onBlur={saveTitle}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur()
          }
        }}
        className={twJoin(planningPanelTitleInputClass, readOnly && 'bg-gray-50 text-gray-500')}
      />
    </label>
  )
}

/** Variant title field — updates the list optimistically, persists on blur. */
export const VariantTitleField = (props: VariantTitleFieldProps) => (
  <VariantTitleFieldForm key={props.variantId} {...props} />
)
