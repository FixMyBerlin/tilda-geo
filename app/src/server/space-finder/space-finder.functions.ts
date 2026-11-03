import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import type { z } from 'zod'
import { createSpaceFinderArea, CreateAreaInput } from './mutations/createSpaceFinderArea.server'
import {
  createSpaceFinderVariant,
  CreateVariantInput,
} from './mutations/createSpaceFinderVariant.server'
import { deleteSpaceFinderArea } from './mutations/deleteSpaceFinderArea.server'
import { deleteSpaceFinderVariant } from './mutations/deleteSpaceFinderVariant.server'
import { duplicateSpaceFinderVariant } from './mutations/duplicateSpaceFinderVariant.server'
import { runSpaceFinderVariant } from './mutations/runSpaceFinderVariant.server'
import { updateSpaceFinderArea, UpdateAreaInput } from './mutations/updateSpaceFinderArea.server'
import {
  updateSpaceFinderVariant,
  UpdateVariantInput,
} from './mutations/updateSpaceFinderVariant.server'
import { getAdminBoundaries, BoundarySearchInput } from './queries/getAdminBoundaries.server'
import { getBoundaryGeom, BoundaryGeomInput } from './queries/getBoundaryGeom.server'
import { getSpaceFinderArea } from './queries/getSpaceFinderArea.server'
import { getSpaceFinderAreas } from './queries/getSpaceFinderAreas.server'
import {
  getSpaceFinderHexagonGeom,
  HexagonGeomInput,
} from './queries/getSpaceFinderHexagonGeom.server'
import { getSpaceFinderJob } from './queries/getSpaceFinderJob.server'
import { getSpaceFinderVariant } from './queries/getSpaceFinderVariant.server'
import { AreaIdInput, JobIdInput, RegionSlugInput, VariantIdInput } from './schemas'

// Queries

export const getSpaceFinderAreasFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof RegionSlugInput>) => RegionSlugInput.parse(data))
  .handler(async ({ data }) => getSpaceFinderAreas(data, getRequestHeaders()))

export const getSpaceFinderAreaFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof AreaIdInput>) => AreaIdInput.parse(data))
  .handler(async ({ data }) => getSpaceFinderArea(data, getRequestHeaders()))

export const getSpaceFinderVariantFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof VariantIdInput>) => VariantIdInput.parse(data))
  .handler(async ({ data }) => getSpaceFinderVariant(data, getRequestHeaders()))

export const getSpaceFinderJobFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof JobIdInput>) => JobIdInput.parse(data))
  .handler(async ({ data }) => getSpaceFinderJob(data, getRequestHeaders()))

export const getAdminBoundariesFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof BoundarySearchInput>) => BoundarySearchInput.parse(data))
  .handler(async ({ data }) => getAdminBoundaries(data, getRequestHeaders()))

export const getBoundaryGeomFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof BoundaryGeomInput>) => BoundaryGeomInput.parse(data))
  .handler(async ({ data }) => getBoundaryGeom(data, getRequestHeaders()))

export const getSpaceFinderHexagonGeomFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof HexagonGeomInput>) => HexagonGeomInput.parse(data))
  .handler(async ({ data }) => getSpaceFinderHexagonGeom(data, getRequestHeaders()))

// Mutations: Area

export const createSpaceFinderAreaFn = createServerFn({ method: 'POST' })
  .validator((data: z.input<typeof CreateAreaInput>) => CreateAreaInput.parse(data))
  .handler(async ({ data }) => createSpaceFinderArea(data, getRequestHeaders()))

export const updateSpaceFinderAreaFn = createServerFn({ method: 'POST' })
  .validator((data: z.input<typeof UpdateAreaInput>) => UpdateAreaInput.parse(data))
  .handler(async ({ data }) => updateSpaceFinderArea(data, getRequestHeaders()))

export const deleteSpaceFinderAreaFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof AreaIdInput>) => AreaIdInput.parse(data))
  .handler(async ({ data }) => deleteSpaceFinderArea(data, getRequestHeaders()))

// Mutations: Variant

export const updateSpaceFinderVariantFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof UpdateVariantInput>) => UpdateVariantInput.parse(data))
  .handler(async ({ data }) => updateSpaceFinderVariant(data, getRequestHeaders()))

export const duplicateSpaceFinderVariantFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof VariantIdInput>) => VariantIdInput.parse(data))
  .handler(async ({ data }) => duplicateSpaceFinderVariant(data, getRequestHeaders()))

export const createSpaceFinderVariantFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof CreateVariantInput>) => CreateVariantInput.parse(data))
  .handler(async ({ data }) => createSpaceFinderVariant(data, getRequestHeaders()))

export const runSpaceFinderVariantFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof VariantIdInput>) => VariantIdInput.parse(data))
  .handler(async ({ data }) => runSpaceFinderVariant(data, getRequestHeaders()))

export const deleteSpaceFinderVariantFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof VariantIdInput>) => VariantIdInput.parse(data))
  .handler(async ({ data }) => deleteSpaceFinderVariant(data, getRequestHeaders()))
