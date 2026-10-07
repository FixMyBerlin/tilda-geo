import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  adminApiAuditContext,
  adminApiMemberCaller,
  type AdminApiAuth,
} from '@/server/api/admin/guardAdminApi.server'
import { AUDITED_MODELS } from '@/server/audit/auditAuditedModels.const'
import { auditChangeSourceFilterLabel } from '@/server/audit/auditChangeSources.const'
import { auditLogFilterWireFields, auditLogListSchema } from '@/server/audit/auditLogFilters.schema'
import { listAuditLog } from '@/server/audit/queries/listAuditLog.server'
import {
  listDataSchemaImports,
  listDataSchemaOverview,
} from '@/server/dataSchema/dataSchemaQueries.server'
import { dataSchemaIdentifierSchema } from '@/server/dataSchema/dataSchemaSpec.schema'
import { importDataSchemaTable } from '@/server/dataSchema/importDataSchemaTable.server'
import { extendBunRequestIdleTimeout } from '@/server/http/extendBunRequestIdleTimeout.server'
import {
  createMapDatasetCategory,
  CreateMapDatasetCategoryInput,
  deleteMapDatasetCategory,
  getMapDatasetCategory,
  listMapDatasetCategories,
  mapDatasetCategoryInputFields,
  updateMapDatasetCategory,
  UpdateMapDatasetCategoryInput,
} from '@/server/map-dataset-categories/mapDatasetCategoryWriteService.server'
import { mcpEnvLabel } from '@/server/mcp/mcpCursorConfig'
import { ok, run } from '@/server/mcp/mcpToolResult'
import { registerNotesTools } from '@/server/mcp/tools/registerNotesTools'
import { registerReviewListsTools } from '@/server/mcp/tools/registerReviewListsTools'
import {
  mapProcessingRunDetail,
  mapProcessingRunListItem,
} from '@/server/processing/mapProcessingRunTimings'
import { getProcessingRun } from '@/server/processing/queries/getProcessingRun.server'
import { listProcessingRuns } from '@/server/processing/queries/listProcessingRuns.server'
import { RegionContractConfigSchema } from '@/server/region-contracts/regionContractSchema'
import {
  createRegionContract,
  deleteRegionContractBySlug,
  getRegionContractDetail,
  listRegionContracts,
  updateRegionContract,
} from '@/server/region-contracts/regionContractWriteService.server'
import { getRegionWithWriteConfig } from '@/server/regions/queries/getRegion.server'
import { getRegionsWithWriteConfig } from '@/server/regions/queries/getRegions.server'
import {
  createRegionConfig,
  deleteRegionConfig,
  updateRegionConfig,
} from '@/server/regions/regionWriteService.server'
import { createRegionUploadFromBytes } from '@/server/regions/uploads/createRegionUploadFromBytes.server'
import { regionUploadFromBytesInputSchema } from '@/server/regions/uploads/regionUploadFromBytes.schema'
import {
  deleteMapDatasetUpload,
  getMapDatasetUpload,
  listMapDatasetUploads,
  removeMapDatasetUploadRegion,
} from '@/server/uploads/mapDatasetUploadService.server'
import { joinCommaList } from '@/shared/orderedList/commaList'
import { offsetSearchFields } from '@/shared/pagination/offsetSearchSchema'

const regionConfigDescription =
  'the full RegionWriteInput (slug, name, fullName, product, status, mapLat/Lng/Zoom, categories, ' +
  'backgroundSources, exports, navigationLinks, notes, maskOsmRelationIds, maskBufferKm, welcome ' +
  '{ enabled, title, subtitle, bodyMarkdown, image { uploadId, altText } | null, sections ' +
  '[{ title, bodyMarkdown?, sortOrder }] (max 8) }, …). When maskOsmRelationIds or maskBufferKm ' +
  'change on create/update, mask geometry is generated (or removed if IDs are empty) in the same ' +
  'request. Validated with RegionWriteSchema (unknown keys are rejected). ' +
  'Full replace only — omit a field and it is cleared. Round-trip from regions_get/list `config`, ' +
  'not from nested client `region` fields. Create logo/welcome images first with region_uploads_create.'

/**
 * Build the per-request MCP server. Tools call the admin services in-process (same code paths as the
 * /api/admin/* routes), attributed via `adminApiAuditContext(auth)`. The server name + `instructions`
 * + the `env_info` tool make the bound environment (DEV/STG/PRD) explicit so an agent can confirm it
 * is on the intended environment before any write.
 */
export function buildMcpServer({ auth, request }: { auth: AdminApiAuth; request: Request }) {
  const envLabel = mcpEnvLabel(process.env.VITE_APP_ENV)
  const origin = process.env.VITE_APP_ORIGIN ?? new URL(request.url).origin
  const auditContext = () => adminApiAuditContext(auth, request)

  const server = new McpServer(
    { name: `tilda-geo-admin--${envLabel}`, version: '1.0.0' },
    {
      instructions:
        `TILDA admin tools bound to the ${envLabel} environment (${origin}). ` +
        `Writes (regions_*, region_uploads_create, region_contracts_*, map_dataset_categories_*, map_dataset_uploads_delete, map_dataset_uploads_remove_region, data_schema_import) mutate the ${envLabel} database — ` +
        `call env_info first and confirm you are on the intended environment before any write. ` +
        `Writes are attributed in the audit log to the API token owner. ` +
        `regions_get / regions_list return { region, config }; use config for regions_update. ` +
        `Upload logo/welcome files with region_uploads_create, then attach via headerLogoId or welcome.image.uploadId. ` +
        `data_schema_list / data_schema_imports_list show S3 dumps, Postgres data.* tables, and Import runs on this environment. ` +
        `region_contracts_* manage contracts (Aufträge) and which regions belong to them. ` +
        `map_dataset_categories_* manage the categories that map dataset uploads (static datasets) are grouped under. ` +
        `map_dataset_uploads_* list, read and remove those uploads; the static datasets script only creates and replaces them, so a retired dataset stays until it is deleted here or in the admin UI. Deleting removes the database row only, the files on S3 stay. ` +
        `processing_runs_list / processing_runs_get read nightly processing timings from public.meta (same data as /admin/processing). ` +
        `note_folders_* / notes_* / note_comments_* manage internal notes (Hinweise) and review_lists_* / review_entries_* / review_entry_comments_* manage review lists (Prüflisten) of one region (regionSlug). ` +
        `They act as the API token owner with the same rules as the region UI: notes and comments can only be edited or deleted by their author (the tool answers "Not allowed: …" otherwise), and only empty folders and lists can be deleted. note_folders_update / review_lists_update also set which regions a folder or list is linked to.`,
    },
  )

  server.registerTool(
    'env_info',
    {
      description:
        'Report which TILDA environment (DEV/STG/PRD) and origin this MCP server is bound to. ' +
        'Call this first to confirm the target environment before any write. ' +
        'Tools include regions_*, region_uploads_create, region_contracts_*, map_dataset_categories_*, ' +
        'map_dataset_uploads_*, data_schema_*, processing_runs_*, audit_list, note_folders_*, notes_*, note_comments_*, ' +
        'review_lists_*, review_entries_* and review_entry_comments_*.',
    },
    () => ok({ environment: envLabel, origin, viteAppEnv: process.env.VITE_APP_ENV }),
  )

  server.registerTool(
    'regions_list',
    {
      description:
        'List all regions. Each item is { region: TRegion (client/nested), config: RegionWriteInput }. ' +
        'Use config for regions_create/update round-trips; do not feed nested region fields into writes.',
    },
    () => run(() => getRegionsWithWriteConfig()),
  )

  server.registerTool(
    'regions_get',
    {
      description:
        'Get a single region by slug as { region: TRegion (client/nested), config: RegionWriteInput }. ' +
        'Use config for regions_update; do not feed nested region fields into writes.',
      inputSchema: { slug: z.string() },
    },
    ({ slug }) => run(() => getRegionWithWriteConfig({ slug })),
  )

  server.registerTool(
    'regions_create',
    {
      description: `Create a region. \`config\` is ${regionConfigDescription}`,
      inputSchema: { config: z.record(z.string(), z.unknown()) },
    },
    ({ config }) => run(() => createRegionConfig(config as never, auditContext())),
  )

  server.registerTool(
    'regions_update',
    {
      description: `Update a region by slug. \`config\` is ${regionConfigDescription}`,
      inputSchema: { slug: z.string(), config: z.record(z.string(), z.unknown()) },
    },
    ({ slug, config }) => run(() => updateRegionConfig(slug, config as never, auditContext())),
  )

  server.registerTool(
    'regions_delete',
    { description: 'Delete a region by slug.', inputSchema: { slug: z.string() } },
    ({ slug }) => run(() => deleteRegionConfig(slug, auditContext())),
  )

  server.registerTool(
    'region_uploads_create',
    {
      description:
        'Create a RegionUpload library row (S3 + DB) for an existing region. ' +
        'Pass filename, mimeType (image/png|jpeg|webp|svg+xml), and contentBase64 (raw or data-URL). ' +
        'Returns { uploadId, title, mimeType, fileSize, regionSlug }. ' +
        'Does not attach the file — then regions_update with headerLogoId or ' +
        'welcome.image: { uploadId, altText }. Max 5 MB; the bytes must really be the declared ' +
        'image type and SVGs must not contain scripts.',
      inputSchema: regionUploadFromBytesInputSchema.shape,
    },
    (args) => run(() => createRegionUploadFromBytes(args, auditContext())),
  )

  server.registerTool(
    'region_contracts_list',
    {
      description:
        'List region contracts (Aufträge) as { id, slug, name, status, regionCount }, sorted by name.',
    },
    () => run(() => listRegionContracts()),
  )

  server.registerTool(
    'region_contracts_get',
    {
      description: 'Get one region contract by slug, including its assigned regionSlugs.',
      inputSchema: { slug: z.string() },
    },
    ({ slug }) => run(() => getRegionContractDetail(slug)),
  )

  server.registerTool(
    'region_contracts_create',
    {
      description:
        'Create a region contract. regionSlugs assigns existing regions to it ' +
        '(a region belongs to at most one contract, so this moves them from any other contract).',
      inputSchema: RegionContractConfigSchema.shape,
    },
    (args) => run(() => createRegionContract(args, auditContext())),
  )

  server.registerTool(
    'region_contracts_update',
    {
      description:
        'Update a region contract by slug (the slug itself cannot change). Full replace: ' +
        'name, status and regionSlugs are all set; regions missing from regionSlugs are unassigned.',
      inputSchema: RegionContractConfigSchema.shape,
    },
    (args) => run(() => updateRegionContract(args.slug, args, auditContext())),
  )

  server.registerTool(
    'region_contracts_delete',
    {
      description:
        'Delete a region contract by slug. Fails while regions are still assigned — ' +
        'remove them first with region_contracts_update.',
      inputSchema: { slug: z.string() },
    },
    ({ slug }) => run(() => deleteRegionContractBySlug(slug, auditContext())),
  )

  server.registerTool(
    'map_dataset_categories_list',
    {
      description:
        'List map dataset categories (the groups static dataset uploads are listed under), ordered by ' +
        'groupKey, sortOrder, categoryKey. key is "<groupKey>/<categoryKey>".',
    },
    () => run(() => listMapDatasetCategories()),
  )

  server.registerTool(
    'map_dataset_categories_get',
    {
      description: 'Get one map dataset category by key ("<groupKey>/<categoryKey>").',
      inputSchema: { key: z.string().min(1) },
    },
    ({ key }) =>
      run(async () => {
        const category = await getMapDatasetCategory(key)
        if (!category) throw new Error(`Map dataset category not found: ${key}`)
        return category
      }),
  )

  server.registerTool(
    'map_dataset_categories_create',
    {
      description:
        'Create a map dataset category. key becomes "<groupKey>/<categoryKey>" (segments must not ' +
        'contain "/"). sortOrder orders categories within a group; subtitle is optional.',
      inputSchema: mapDatasetCategoryInputFields,
    },
    (args) =>
      run(() =>
        createMapDatasetCategory(CreateMapDatasetCategoryInput.parse(args), auditContext()),
      ),
  )

  server.registerTool(
    'map_dataset_categories_update',
    {
      description:
        'Update a map dataset category by its current key. Full replace of groupKey, categoryKey, ' +
        'sortOrder, title, subtitle; changing groupKey/categoryKey renames the key.',
      inputSchema: { key: z.string().min(1).max(191), ...mapDatasetCategoryInputFields },
    },
    (args) =>
      run(async () => {
        const result = await updateMapDatasetCategory(
          UpdateMapDatasetCategoryInput.parse(args),
          auditContext(),
        )
        if (!result.ok) throw new Error(`A category with that key already exists (${result.error})`)
        return result.category
      }),
  )

  server.registerTool(
    'map_dataset_categories_delete',
    {
      description: 'Delete a map dataset category by key.',
      inputSchema: { key: z.string().min(1).max(191) },
    },
    ({ key }) => run(() => deleteMapDatasetCategory(key, auditContext())),
  )

  server.registerTool(
    'map_dataset_uploads_list',
    {
      description:
        'List map dataset uploads (static datasets), ordered by slug. Each item has slug, public, ' +
        'createdBy, updatedAt, dataUpdatedNote, regionSlugs and configs [{ name, categoryKey }] — ' +
        'no layers. Optional filters: regionSlug (uploads linked to that region) and categoryKey ' +
        '(uploads with a config in that category, see map_dataset_categories_list). ' +
        'Use map_dataset_uploads_get for the full configs.',
      inputSchema: {
        regionSlug: z.string().optional(),
        categoryKey: z.string().optional(),
      },
    },
    (args) => run(() => listMapDatasetUploads(args)),
  )

  server.registerTool(
    'map_dataset_uploads_get',
    {
      description:
        'Get one map dataset upload by slug: the full row with its configs (layers, inspector, ' +
        'legends, …) and regionSlugs.',
      inputSchema: { slug: z.string().min(1) },
    },
    ({ slug }) =>
      run(async () => {
        const upload = await getMapDatasetUpload(slug)
        if (!upload) throw new Error(`Map dataset upload not found: ${slug}`)
        return upload
      }),
  )

  server.registerTool(
    'map_dataset_uploads_delete',
    {
      description:
        'Delete one map dataset upload by slug, same as the delete button in the admin UI: the ' +
        'database row, its configs and its region links are removed, so the dataset disappears ' +
        'from every region. The files on S3 (GeoJSON, PMTiles) are NOT deleted. Returns the ' +
        'deleted row with configs and regionSlugs — keep it for a rollback. To restore, run the ' +
        'static datasets script for that dataset again; there is no MCP tool to re-create an ' +
        'upload. Fails with an error when the slug does not exist.',
      inputSchema: { slug: z.string().min(1) },
    },
    ({ slug }) => run(() => deleteMapDatasetUpload(slug, auditContext())),
  )

  server.registerTool(
    'map_dataset_uploads_remove_region',
    {
      description:
        'Unlink one region from a map dataset upload without deleting the upload; other regions ' +
        'keep it. Returns { slug, regionSlugs } with the remaining regions. Fails when the upload ' +
        'does not exist or is not linked to that region.',
      inputSchema: { uploadSlug: z.string().min(1), regionSlug: z.string().min(1) },
    },
    (args) => run(() => removeMapDatasetUploadRegion(args, auditContext())),
  )

  server.registerTool(
    'data_schema_list',
    {
      description:
        `List data-schema tables on ${envLabel}: S3 spec/dump summary, snapshot ids, recent Import runs, ` +
        'and which tables currently exist in Postgres data.*. Same environment as env_info. ' +
        'Use data_schema_imports_list for the full Import history.',
    },
    () => run(() => listDataSchemaOverview()),
  )

  server.registerTool(
    'data_schema_imports_list',
    {
      description:
        `List all data-schema Import runs on ${envLabel} (PENDING/RUNNING/SUCCESS/FAILED), newest first. ` +
        'Optional table and status filters; paginate with take/skip.',
      inputSchema: {
        table: dataSchemaIdentifierSchema.optional(),
        status: z.enum(['PENDING', 'RUNNING', 'SUCCESS', 'FAILED']).optional(),
        ...offsetSearchFields(),
      },
    },
    (args) => run(() => listDataSchemaImports(args)),
  )

  server.registerTool(
    'data_schema_import',
    {
      description:
        `Restore S3 data.dump into Postgres data.<table> on ${envLabel} (same as /admin/data-schema Import). ` +
        'Drops the table if it exists, then pg_restore. Call env_info first. Optional snapshotId restores that snapshot dump.',
      inputSchema: {
        table: dataSchemaIdentifierSchema,
        snapshotId: z.string().min(1).nullable().optional(),
      },
    },
    (args) =>
      run(async () => {
        extendBunRequestIdleTimeout(request, 0)
        return importDataSchemaTable({
          table: args.table,
          snapshotId: args.snapshotId ?? null,
          userId: auth.createdById,
        })
      }),
  )

  server.registerTool(
    'processing_runs_list',
    {
      description:
        `List processing runs on ${envLabel} from public.meta (newest first), same source as /admin/processing. ` +
        'Each item has status, durations, OSM date, topic completed/skipped counts, and the slowest topics. ' +
        'Paginate with take/skip (default 50, max 200). Use processing_runs_get for per-topic timings.',
      inputSchema: {
        ...offsetSearchFields(),
      },
    },
    (args) =>
      run(async () => {
        const result = await listProcessingRuns(args)
        return {
          ...result,
          rows: result.rows.map(mapProcessingRunListItem),
        }
      }),
  )

  server.registerTool(
    'processing_runs_get',
    {
      description:
        `Get one processing run on ${envLabel} with parsed topic timings (lua/sql/diff ms), skip reasons, ` +
        'orphaned topic ids, and afterthoughts. Omit id for the latest run. Optional topic filters to one topic id.',
      inputSchema: {
        id: z.coerce.number().int().positive().optional(),
        topic: z.string().min(1).optional(),
      },
    },
    (args) =>
      run(async () => {
        const run = await getProcessingRun(args.id)
        return mapProcessingRunDetail(run, args.topic)
      }),
  )

  server.registerTool(
    'audit_list',
    {
      description:
        `List audit-log entries across all audited models (${joinCommaList([...AUDITED_MODELS])}). ` +
        'Filter by model, recordId, userId, changeSource ' +
        `(${auditChangeSourceFilterLabel}; Bearer-token writes including MCP log as API), from/to (ISO ` +
        'dates); paginate with take/skip. Useful for inspecting or planning a rollback.',
      inputSchema: {
        ...auditLogFilterWireFields,
        ...offsetSearchFields(),
      },
    },
    (args) => run(() => listAuditLog(auditLogListSchema.parse(args))),
  )

  const memberCaller = adminApiMemberCaller(auth, request)
  registerNotesTools(server, memberCaller)
  registerReviewListsTools(server, memberCaller)

  return server
}
