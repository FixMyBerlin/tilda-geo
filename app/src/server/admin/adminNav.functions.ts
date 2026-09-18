import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { getAdminNavCounts } from '@/server/admin/queries/getAdminNavCounts.server'
import { getAdminNavRegions } from '@/server/admin/queries/getAdminNavRegions.server'

export const getAdminNavCountsFn = createServerFn({ method: 'GET' }).handler(async () =>
  getAdminNavCounts(getRequestHeaders()),
)

export const getAdminNavRegionsFn = createServerFn({ method: 'GET' }).handler(async () =>
  getAdminNavRegions(getRequestHeaders()),
)
