import type { MapDataCategoryParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/type'
import { _1qldklk } from './_1qldklk'
import { _1r6doko } from './_1r6doko'
import { _12nl2cs } from './_12nl2cs'
import { _14ltyea } from './_14ltyea'
import { _166cmie } from './_166cmie'
import { _gzvfwv } from './_gzvfwv'

/** Legacy `?config=` templates used by redirect/migration unit tests. */
const legacyConfigTemplates = {
  '12nl2cs': _12nl2cs,
  '14ltyea': _14ltyea,
  '166cmie': _166cmie,
  '1qldklk': _1qldklk,
  '1r6doko': _1r6doko,
  gzvfwv: _gzvfwv,
} as const satisfies Record<string, MapDataCategoryParam[]>

export function getLegacyConfigTemplate(checksum: string) {
  return legacyConfigTemplates[checksum as keyof typeof legacyConfigTemplates]
}
