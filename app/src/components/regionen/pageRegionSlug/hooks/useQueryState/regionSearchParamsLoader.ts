/**
 * Server-side parsing of region search params using the same nuqs parsers as the client.
 * Uses createLoader from nuqs/server so there is a single source of truth (searchParamsParsers).
 *
 * We do not use the .server.ts filename here because the only importer is a route file
 * (regionen/$regionSlug.tsx). Per our conventions, route files must not import .server.ts so they
 * stay loadable in the client bundle; import protection would fail. This module is only used inside
 * the loader (server context); the bundler tree-shakes it so nuqs/server does not end up on the client.
 */
import { createLoader } from 'nuqs/server'
import { searchParamsParsers } from './searchParamsParsers'
import { searchParamsRegistry } from './searchParamsRegistry'

const regionSearchParamsDescriptor = {
  [searchParamsRegistry.qa]: searchParamsParsers.qa,
  [searchParamsRegistry.atlasNotesFilter]: searchParamsParsers.atlasNotesFilter,
  [searchParamsRegistry.qaFilter]: searchParamsParsers.qaFilter,
} as const

export const loadRegionSearchParams = createLoader(regionSearchParamsDescriptor)
