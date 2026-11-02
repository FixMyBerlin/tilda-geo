import { createServerFn } from '@tanstack/react-start'
import type { z } from 'zod'
import { getRouteRelations, RouteRelationsSchema } from './queries/getRouteRelations.server'

// POST: a way on a busy street can belong to dozens of bus routes.
export const getRouteRelationsFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof RouteRelationsSchema>) => RouteRelationsSchema.parse(data))
  .handler(async ({ data }) => getRouteRelations(data))
