import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { adminApiAuditContext, type AdminApiAuth } from '@/server/api/admin/guardAdminApi.server'
import { AUDITED_MODELS } from '@/server/audit/auditAuditedModels.const'
import { auditChangeSourceFilterLabel } from '@/server/audit/auditChangeSources.const'
import { auditLogFilterWireFields, auditLogListSchema } from '@/server/audit/auditLogFilters.schema'
import { listAuditLog } from '@/server/audit/queries/listAuditLog.server'
import { mcpEnvLabel } from '@/server/mcp/mcpCursorConfig'
import { getRegion } from '@/server/regions/queries/getRegion.server'
import { getRegions } from '@/server/regions/queries/getRegions.server'
import {
  createRegionConfig,
  deleteRegionConfig,
  updateRegionConfig,
} from '@/server/regions/regionWriteService.server'
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
  'request. Validated with RegionWriteSchema; returns an error with the issues on invalid input. ' +
  'See the manage-regions skill for required fields.'

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
        `TILDA region admin tools bound to the ${envLabel} environment (${origin}). ` +
        `Writes (regions_create / regions_update / regions_delete) mutate the ${envLabel} database — ` +
        `call env_info first and confirm you are on the intended environment before any write. ` +
        `Writes are attributed in the audit log to the API token owner.`,
    },
  )

  server.registerTool(
    'env_info',
    {
      description:
        'Report which TILDA environment (DEV/STG/PRD) and origin this MCP server is bound to. ' +
        'Call this first to confirm the target environment before any write.',
    },
    () => ok({ environment: envLabel, origin, viteAppEnv: process.env.VITE_APP_ENV }),
  )

  server.registerTool(
    'regions_list',
    { description: 'List all regions with their full DB-backed config.' },
    () => run(() => getRegions()),
  )

  server.registerTool(
    'regions_get',
    { description: 'Get a single region by slug.', inputSchema: { slug: z.string() } },
    ({ slug }) => run(() => getRegion({ slug })),
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
