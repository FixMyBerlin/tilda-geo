import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { TextField } from '@/components/shared/form/fields/TextField'
import type { FormApi } from '@/components/shared/form/types'
import { parseOsmRelationIds } from '@/server/regions/masks/parseOsmRelationIds'
import { checkMaskBoundaryIdsFn } from '@/server/regions/regions.functions'
import type { RegionFormInput } from '@/server/regions/regionWriteSchema'

/** Debounce via timer (external-timing effect; same pattern as map geocoding search). */
function useDebouncedValue(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(
    function syncDebouncedValue() {
      const timer = setTimeout(() => setDebounced(value), delayMs)
      return function cancelDebounce() {
        clearTimeout(timer)
      }
    },
    [value, delayMs],
  )
  return debounced
}

type Props = {
  form: FormApi<RegionFormInput>
}

/**
 * OSM relation ID field + soft async check against the geo `boundaries` table (mask geometry
 * source). Missing IDs are a warning only — local DBs often lack full coverage.
 */
export function RegionMaskOsmRelationIdsField({ form }: Props) {
  return (
    <form.Subscribe selector={(state) => state.values.maskOsmRelationIds}>
      {(rawIds) => (
        <form.Subscribe selector={(state) => state.values.maskEnabled}>
          {(maskEnabled) => (
            <RegionMaskOsmRelationIdsFieldInner
              form={form}
              rawIds={String(rawIds ?? '')}
              maskEnabled={maskEnabled === 'true'}
            />
          )}
        </form.Subscribe>
      )}
    </form.Subscribe>
  )
}

function RegionMaskOsmRelationIdsFieldInner({
  form,
  rawIds,
  maskEnabled,
}: {
  form: FormApi<RegionFormInput>
  rawIds: string
  maskEnabled: boolean
}) {
  const debouncedRaw = useDebouncedValue(rawIds, 400)
  const [blurPinnedRaw, setBlurPinnedRaw] = useState<string | null>(null)
  const checkRaw = blurPinnedRaw === rawIds ? rawIds : debouncedRaw

  let parsedIds: number[] | null = null
  let parseError: string | null = null
  if (maskEnabled && checkRaw.trim()) {
    try {
      parsedIds = parseOsmRelationIds(checkRaw)
    } catch (error) {
      parseError = error instanceof Error ? error.message : 'Ungültige OSM-Relation-IDs'
    }
  }

  const { data, isFetching, isError } = useQuery({
    queryKey: ['admin', 'mask-boundary-ids', parsedIds ?? []],
    queryFn: () => checkMaskBoundaryIdsFn({ data: { ids: parsedIds! } }),
    enabled: maskEnabled && parsedIds != null && parsedIds.length > 0,
    staleTime: 60_000,
  })

  return (
    <div>
      <TextField
        form={form}
        name="maskOsmRelationIds"
        label="OSM Relation IDs"
        help="Komma- oder leerzeichengetrennt"
        onBlur={() => setBlurPinnedRaw(rawIds)}
      />
      {maskEnabled ? (
        <MaskBoundaryLookupStatus
          parseError={parseError}
          isFetching={isFetching}
          isError={isError}
          data={data}
          hasIds={Boolean(parsedIds?.length)}
        />
      ) : null}
    </div>
  )
}

function MaskBoundaryLookupStatus({
  parseError,
  isFetching,
  isError,
  data,
  hasIds,
}: {
  parseError: string | null
  isFetching: boolean
  isError: boolean
  data: { found: number[]; missing: number[] } | undefined
  hasIds: boolean
}) {
  if (parseError) {
    return <p className="mt-2 text-sm text-amber-800">{parseError}</p>
  }
  if (!hasIds) return null
  if (isFetching && !data) {
    return <p className="mt-2 text-sm text-gray-500">Prüfe Grenzen-Tabelle…</p>
  }
  if (isError) {
    return (
      <p className="mt-2 text-sm text-amber-800">
        Grenzen-Tabelle konnte nicht geprüft werden (Warnung).
      </p>
    )
  }
  if (!data) return null

  if (data.missing.length === 0) {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-sm text-green-800">
        <CheckCircleIcon className="size-4 shrink-0" aria-hidden />
        Relation in Grenzen-Tabelle gefunden
      </p>
    )
  }

  return (
    <p className="mt-2 flex items-start gap-1.5 text-sm text-amber-800">
      <ExclamationTriangleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        Nicht in Grenzen-Tabelle: {data.missing.join(', ')}. Speichern kann die Maske fehlschlagen;
        lokal fehlen oft Daten.
      </span>
    </p>
  )
}
