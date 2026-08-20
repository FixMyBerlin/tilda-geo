import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { adminApiAuditContext, type AdminApiAuth } from '@/server/api/admin/guardAdminApi.server'
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
import { mcpEnvLabel } from '@/server/mcp/mcpCursorConfig'
import { getRegionWithWriteConfig } from '@/server/regions/queries/getRegion.server'
import { getRegionsWithWriteConfig } from '@/server/regions/queries/getRegions.server'
import {
  createRegionConfig,
  deleteRegionConfig,
  updateRegionConfig,
} from '@/server/regions/regionWriteService.server'
import { createRegionUploadFromBytes } from '@/server/regions/uploads/createRegionUploadFromBytes.server'
import { regionUploadFromBytesInputSchema } from '@/server/regions/uploads/regionUploadFromBytes.schema'
import { joinCommaList } from '@/shared/orderedList/commaList'
import { offsetSearchFields } from '@/shared/pagination/offsetSearchSchema'

const ok = (data: unknown) => ({
  content: [
    {
      type: 'text' as const,
      text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
    },
  ],
})

const fail = (error: unknown) => ({
  content: [
    {
      type: 'text' as const,
      text: `Error: ${error instanceof Error ? error.message : String(error)}`,
    },
  ],
  isError: true,
})

const run = async (fn: () => Promise<unknown>) => {
  try {
    return ok(await fn())
  } catch (error) {
    return fail(error)
  }
}

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
        `Writes (regions_create / regions_update / regions_delete / region_uploads_create / data_schema_import) mutate the ${envLabel} database — ` +
        `call env_info first and confirm you are on the intended environment before any write. ` +
        `Writes are attributed in the audit log to the API token owner. ` +
        `regions_get / regions_list return { region, config }; use config for regions_update. ` +
        `Upload logo/welcome files with region_uploads_create, then attach via headerLogoId or welcome.image.uploadId. ` +
        `data_schema_list / data_schema_imports_list show S3 dumps, Postgres data.* tables, and Import runs on this environment.`,
    },
  )

  server.registerTool(
    'env_info',
    {
      description:
        'Report which TILDA environment (DEV/STG/PRD) and origin this MCP server is bound to. ' +
        'Call this first to confirm the target environment before any write. ' +
        'Tools include data_schema_list / data_schema_imports_list / data_schema_import and region_uploads_create.',
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
        ...offsetSearchFields({ maxTake: 200 }),
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
    'audit_list',
    {
      description:
        `List audit-log entries across all audited models (${joinCommaList([...AUDITED_MODELS])}). ` +
        'Filter by model, recordId, userId, changeSource ' +
        `(${auditChangeSourceFilterLabel}; Bearer-token writes including MCP log as API), from/to (ISO ` +
        'dates); paginate with take/skip. Useful for inspecting or planning a rollback.',
      inputSchema: {
        ...auditLogFilterWireFields,
        ...offsetSearchFields({ maxTake: 200 }),
      },
    },
    (args) => run(() => listAuditLog(auditLogListSchema.parse(args))),
  )

  return server
}
