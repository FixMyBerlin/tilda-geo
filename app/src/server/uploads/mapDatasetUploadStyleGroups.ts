import { z } from 'zod'
import type { Prisma } from '@/prisma/generated/client'
import type { StaticDatasetStyleGroup } from '@/scripts/StaticDatasets/types'

/** `MapDatasetUpload.styleGroups`: the `styleGroups` of a static dataset `meta.ts`. */
export const mapDatasetUploadStyleGroupsSchema = z.array(
  z.object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use a slug like `datensatz-b`'),
    name: z.string().min(1),
  }),
) satisfies z.ZodType<StaticDatasetStyleGroup[]>

type ConfigForStyleGroups = {
  name: string
  subId?: string
  categoryKey?: string | null
  styleGroup?: string
}

/**
 * Problems with the style groups of one dataset; empty when valid. Shared by the static datasets
 * script (fails before the S3 upload) and the upload API.
 */
export function styleGroupProblems(
  styleGroups: StaticDatasetStyleGroup[] | null | undefined,
  configs: ConfigForStyleGroups[],
) {
  const problems: string[] = []
  const groups = styleGroups ?? []
  const groupIds = groups.map((group) => group.id)

  for (const id of new Set(groupIds)) {
    if (groupIds.filter((groupId) => groupId === id).length > 1) {
      problems.push(`styleGroups: id "${id}" is used more than once`)
    }
  }

  for (const config of configs) {
    if (config.styleGroup && !groupIds.includes(config.styleGroup)) {
      problems.push(
        `config "${config.name}": styleGroup "${config.styleGroup}" is missing in styleGroups`,
      )
    }
  }

  for (const id of new Set(groupIds)) {
    const members = configs.filter((config) => config.styleGroup === id)
    if (members.length < 2) {
      problems.push(`styleGroup "${id}" needs at least two configs, has ${members.length}`)
    }
    if (new Set(members.map((config) => config.categoryKey ?? null)).size > 1) {
      problems.push(`styleGroup "${id}": all its configs need the same categoryKey`)
    }
    // The subId makes the `data` URL key of a style; equal keys would switch two styles at once.
    if (new Set(members.map((config) => config.subId ?? '')).size < members.length) {
      problems.push(`styleGroup "${id}": each config needs its own subId (one may omit it)`)
    }
  }

  return problems
}

/** Fail-loud parse for DB reads; `[]` when the dataset has no style groups. */
export function parseMapDatasetUploadStyleGroups(json: unknown) {
  if (json === null || json === undefined) return []
  return mapDatasetUploadStyleGroupsSchema.parse(json)
}

/** Prisma `styleGroups` column write; SQL NULL when the dataset has none. */
export function mapDatasetUploadStyleGroupsToPrismaJson(
  styleGroups: StaticDatasetStyleGroup[] | null | undefined,
) {
  return styleGroups?.length ? (styleGroups as Prisma.InputJsonValue) : undefined
}
