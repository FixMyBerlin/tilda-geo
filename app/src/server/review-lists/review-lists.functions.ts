import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { ReviewEntryStatus } from '@/prisma/generated/enums'
import { reviewEntryGeometrySchema } from './geojson'
import { createReviewEntriesFromGeojson } from './mutations/createReviewEntriesFromGeojson.server'
import { createReviewEntry } from './mutations/createReviewEntry.server'
import { createReviewEntryComment } from './mutations/createReviewEntryComment.server'
import { createReviewList } from './mutations/createReviewList.server'
import { deleteReviewEntry } from './mutations/deleteReviewEntry.server'
import { deleteReviewList } from './mutations/deleteReviewList.server'
import { deleteReviewListForAdmin } from './mutations/deleteReviewListForAdmin.server'
import { updateReviewEntry } from './mutations/updateReviewEntry.server'
import { updateReviewList } from './mutations/updateReviewList.server'
import { updateReviewListForAdmin } from './mutations/updateReviewListForAdmin.server'
import { getReviewEntriesForList } from './queries/getReviewEntriesForList.server'
import { getReviewEntry } from './queries/getReviewEntry.server'
import { getReviewListGeojson } from './queries/getReviewListGeojson.server'
import { getReviewListsForRegion } from './queries/getReviewListsForRegion.server'
import { DeleteReviewListSchema, UpdateReviewListFormSchema } from './schemas'

const RegionSlug = z.object({ regionSlug: z.string() })
const ListInRegion = RegionSlug.extend({ listId: z.number() })
const EntryInRegion = RegionSlug.extend({ entryId: z.number() })
const GeometryInput = reviewEntryGeometrySchema

// Queries
export const getReviewListsForRegionFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof RegionSlug>) => RegionSlug.parse(data))
  .handler(async ({ data }) => getReviewListsForRegion(data, getRequestHeaders()))

export const getReviewEntriesForListFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof ListInRegion>) => ListInRegion.parse(data))
  .handler(async ({ data }) => getReviewEntriesForList(data, getRequestHeaders()))

export const getReviewEntryFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof EntryInRegion>) => EntryInRegion.parse(data))
  .handler(async ({ data }) => getReviewEntry(data, getRequestHeaders()))

export const getReviewListGeojsonFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof ListInRegion>) => ListInRegion.parse(data))
  .handler(async ({ data }) => getReviewListGeojson(data, getRequestHeaders()))

// List mutations
const CreateListInput = RegionSlug.extend({ name: z.string().trim().min(1) })
export const createReviewListFn = createServerFn({ method: 'POST' })
  .validator(CreateListInput)
  .handler(async ({ data }) => createReviewList(data, getRequestHeaders()))

const UpdateListInput = ListInRegion.extend({
  name: z.string().trim().min(1).optional(),
  regionSlugs: z.array(z.string()).optional(),
})
export const updateReviewListFn = createServerFn({ method: 'POST' })
  .validator(UpdateListInput)
  .handler(async ({ data }) => updateReviewList(data, getRequestHeaders()))

export const deleteReviewListFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof ListInRegion>) => ListInRegion.parse(data))
  .handler(async ({ data }) => deleteReviewList(data, getRequestHeaders()))

// Admin list mutations
export const updateReviewListForAdminFn = createServerFn({ method: 'POST' })
  .validator((data: { id: number } & z.input<typeof UpdateReviewListFormSchema>) => {
    const { id, ...rest } = data
    const config = UpdateReviewListFormSchema.parse(rest)
    return { id, ...config }
  })
  .handler(async ({ data }) => {
    const { id, ...config } = data
    return updateReviewListForAdmin(id, config, getRequestHeaders())
  })

export const deleteReviewListForAdminFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof DeleteReviewListSchema>) => DeleteReviewListSchema.parse(data))
  .handler(async ({ data }) => deleteReviewListForAdmin(data, getRequestHeaders()))

// Entry mutations
const CreateEntriesFromGeojsonInput = ListInRegion.extend({
  filename: z.string().optional(),
  s3Key: z.string().min(1),
})
export const createReviewEntriesFromGeojsonFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof CreateEntriesFromGeojsonInput>) =>
    CreateEntriesFromGeojsonInput.parse(data),
  )
  .handler(async ({ data }) => createReviewEntriesFromGeojson(data, getRequestHeaders()))

const CreateEntryInput = ListInRegion.extend({
  geometry: GeometryInput,
  properties: z.record(z.string(), z.unknown()).optional(),
})
export const createReviewEntryFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof CreateEntryInput>) => CreateEntryInput.parse(data))
  .handler(async ({ data }) => createReviewEntry(data, getRequestHeaders()))

const UpdateEntryInput = EntryInRegion.extend({
  geometry: GeometryInput.optional(),
  properties: z.record(z.string(), z.unknown()).nullable().optional(),
  status: z.enum(ReviewEntryStatus).optional(),
})
export const updateReviewEntryFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof UpdateEntryInput>) => UpdateEntryInput.parse(data))
  .handler(async ({ data }) => updateReviewEntry(data, getRequestHeaders()))

export const deleteReviewEntryFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof EntryInRegion>) => EntryInRegion.parse(data))
  .handler(async ({ data }) => deleteReviewEntry(data, getRequestHeaders()))

const CreateCommentInput = EntryInRegion.extend({ body: z.string().trim().min(1) })
export const createReviewEntryCommentFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof CreateCommentInput>) => CreateCommentInput.parse(data))
  .handler(async ({ data }) => createReviewEntryComment(data, getRequestHeaders()))
