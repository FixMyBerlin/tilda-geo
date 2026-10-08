import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { ReviewEntryStatus } from '@/prisma/generated/enums'
import type { AdminApiCaller } from '@/server/auth/memberCaller.server'
import { run } from '@/server/mcp/mcpToolResult'
import { reviewEntryGeometrySchema } from '@/server/review-lists/geojson'
import { createReviewEntry } from '@/server/review-lists/mutations/createReviewEntry.server'
import { createReviewEntryComment } from '@/server/review-lists/mutations/createReviewEntryComment.server'
import { createReviewList } from '@/server/review-lists/mutations/createReviewList.server'
import { deleteReviewEntry } from '@/server/review-lists/mutations/deleteReviewEntry.server'
import { deleteReviewList } from '@/server/review-lists/mutations/deleteReviewList.server'
import { updateReviewEntry } from '@/server/review-lists/mutations/updateReviewEntry.server'
import { updateReviewEntryComment } from '@/server/review-lists/mutations/updateReviewEntryComment.server'
import { updateReviewListForAdmin } from '@/server/review-lists/mutations/updateReviewListForAdmin.server'
import { getReviewEntriesForList } from '@/server/review-lists/queries/getReviewEntriesForList.server'
import { getReviewEntry } from '@/server/review-lists/queries/getReviewEntry.server'
import { getReviewListsForRegion } from '@/server/review-lists/queries/getReviewListsForRegion.server'
import { idInput, regionSlugInput } from './mcpToolInputs'
import { registerCollectionTools } from './registerCollectionTools'

const geometryInput = reviewEntryGeometrySchema.describe(
  'GeoJSON geometry { type, coordinates } in WGS84 (lon, lat). GeometryCollection is not supported.',
)
const propertiesInput = z
  .record(z.string(), z.unknown())
  .describe('Display attributes shown with the entry; values are stored as strings.')

/** Review lists ("Prüflisten") and their entries — the same functions the region UI calls. */
export function registerReviewListsTools(server: McpServer, caller: AdminApiCaller) {
  registerCollectionTools(server, {
    prefix: 'review_lists',
    noun: 'review list',
    contents: 'entries',
    list: async (input) => (await getReviewListsForRegion(input, caller)).lists,
    create: (input) => createReviewList(input, caller),
    update: ({ id, ...config }) => updateReviewListForAdmin(id, config, caller),
    remove: ({ id, ...input }) => deleteReviewList({ ...input, listId: id }, caller),
  })

  server.registerTool(
    'review_entries_list',
    {
      description:
        'List the entries of a review list as a GeoJSON FeatureCollection (properties: id, status ' +
        'OPEN|OK|PROBLEM, source UPLOAD|MANUAL, importId, authorName, commentCount, data = the ' +
        'display attributes).',
      inputSchema: { regionSlug: regionSlugInput, listId: idInput },
    },
    (args) => run(() => getReviewEntriesForList(args, caller)),
  )

  server.registerTool(
    'review_entries_get',
    {
      description:
        'Get one review entry with status, display attributes, author and all comments. ' +
        'The geometry is part of review_entries_list.',
      inputSchema: { regionSlug: regionSlugInput, entryId: idInput },
    },
    (args) => run(() => getReviewEntry(args, caller)),
  )

  server.registerTool(
    'review_entries_create',
    {
      description:
        'Add one entry to a review list (source MANUAL, status OPEN, attributed to the API token ' +
        'owner). Returns { id }.',
      inputSchema: {
        regionSlug: regionSlugInput,
        listId: idInput,
        geometry: geometryInput,
        properties: propertiesInput.optional(),
      },
    },
    (args) => run(() => createReviewEntry(args, caller)),
  )

  server.registerTool(
    'review_entries_update',
    {
      description:
        'Update a review entry. Only the given fields change: geometry, properties (full replace ' +
        'of the display attributes; null clears them) and/or status.',
      inputSchema: {
        regionSlug: regionSlugInput,
        entryId: idInput,
        geometry: geometryInput.optional(),
        properties: propertiesInput.nullable().optional(),
        status: z.enum(ReviewEntryStatus).optional(),
      },
    },
    (args) => run(() => updateReviewEntry(args, caller)),
  )

  server.registerTool(
    'review_entries_delete',
    {
      description: 'Delete a review entry including its comments.',
      inputSchema: { regionSlug: regionSlugInput, entryId: idInput },
    },
    (args) => run(() => deleteReviewEntry(args, caller)),
  )

  server.registerTool(
    'review_entry_comments_create',
    {
      description:
        'Add a comment (Markdown) to a review entry. The author is the API token owner. ' +
        'Comments cannot be deleted.',
      inputSchema: { regionSlug: regionSlugInput, entryId: idInput, body: z.string().min(1) },
    },
    (args) => run(() => createReviewEntryComment(args, caller)),
  )

  server.registerTool(
    'review_entry_comments_update',
    {
      description:
        'Edit a review entry comment. Only the author (here: the API token owner) may do this.',
      inputSchema: { regionSlug: regionSlugInput, commentId: idInput, body: z.string().min(1) },
    },
    (args) => run(() => updateReviewEntryComment(args, caller)),
  )
}
