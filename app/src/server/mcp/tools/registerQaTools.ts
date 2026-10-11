import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { QaEvaluationStatus } from '@/prisma/generated/enums'
import type { AdminApiCaller } from '@/server/auth/memberCaller.server'
import { run } from '@/server/mcp/mcpToolResult'
import { createQaEvaluation } from '@/server/qa-configs/mutations/createQaEvaluation.server'
import { updateQaEvaluationBody } from '@/server/qa-configs/mutations/updateQaEvaluationBody.server'
import {
  QA_AREA_LIST_LIMIT_ALL,
  QA_AREA_LIST_LIMIT_VIEW,
} from '@/server/qa-configs/qaAreaList.const'
import { getQaAreaList, QaAreaListSchema } from '@/server/qa-configs/queries/getQaAreaList.server'
import { getQaConfigsForRegion } from '@/server/qa-configs/queries/getQaConfigsForRegion.server'
import { getQaDecisionDataForArea } from '@/server/qa-configs/queries/getQaDecisionDataForArea.server'
import { getQaEvaluationsForArea } from '@/server/qa-configs/queries/getQaEvaluationsForArea.server'
import { idInput, regionSlugInput } from './mcpToolInputs'

const configSlugInput = z.string().min(1).describe('Slug of the QA config (see qa_configs_list).')
const areaIdInput = z
  .string()
  .min(1)
  .describe('Id of the area in the map table of the QA config (see qa_areas_list).')

/** QA evaluations ("Qualitätssicherung") — the same functions the region UI calls. */
export function registerQaTools(server: McpServer, caller: AdminApiCaller) {
  server.registerTool(
    'qa_configs_list',
    {
      description:
        'List the QA configs of a region as { slug, label, isActive, mapTable, goodThreshold, ' +
        'needsReviewThreshold, absoluteDifferenceThreshold, evaluationCount }. Read-only: configs ' +
        'are managed in the admin UI.',
      inputSchema: { regionSlug: regionSlugInput },
    },
    (args) =>
      run(async () =>
        (await getQaConfigsForRegion(args, caller)).map((config) => ({
          slug: config.slug,
          label: config.label,
          isActive: config.isActive,
          mapTable: config.mapTable,
          goodThreshold: config.goodThreshold,
          needsReviewThreshold: config.needsReviewThreshold,
          absoluteDifferenceThreshold: config.absoluteDifferenceThreshold,
          evaluationCount: config._count.qaEvaluations,
        })),
      ),
  )

  server.registerTool(
    'qa_areas_list',
    {
      description:
        'List the areas of a QA config with their latest evaluation (areaId, bbox, center, ' +
        'systemStatus, userStatus, evaluatorType, author, commentCount), biggest absolute change ' +
        `first. Returns { items, totalCount, limit }: at most ${QA_AREA_LIST_LIMIT_ALL} items, or ` +
        `${QA_AREA_LIST_LIMIT_VIEW} with a bbox ([minLng, minLat, maxLng, maxLat] in WGS84). ` +
        'Optional filters: status, userIds (author of the latest evaluation) and search (comments).',
      inputSchema: {
        ...QaAreaListSchema.shape,
        regionSlug: regionSlugInput,
        configSlug: configSlugInput,
      },
    },
    (args) => run(() => getQaAreaList(args, caller)),
  )

  server.registerTool(
    'qa_evaluations_list',
    {
      description:
        'List all evaluations of one area, newest first: system and user evaluations with ' +
        'systemStatus, userStatus, body, decisionData and author.',
      inputSchema: {
        regionSlug: regionSlugInput,
        configSlug: configSlugInput,
        areaId: areaIdInput,
      },
    },
    (args) => run(() => getQaEvaluationsForArea(args, caller)),
  )

  server.registerTool(
    'qa_evaluations_create',
    {
      description:
        'Add a user evaluation to an area: userStatus plus an optional comment (body, Markdown). ' +
        'The author is the API token owner. The current counts of the area are stored with the ' +
        'evaluation, as in the region UI. Evaluations are a history: a new one replaces the ' +
        'previous as the current status of the area, and none can be deleted.',
      inputSchema: {
        regionSlug: regionSlugInput,
        configSlug: configSlugInput,
        areaId: areaIdInput,
        userStatus: z.enum(QaEvaluationStatus),
        body: z.string().optional(),
      },
    },
    (args) =>
      run(async () => {
        const decisionData = await getQaDecisionDataForArea(args, caller)
        if (!decisionData) {
          throw new Error(`Area not found in this QA config: ${args.areaId}`)
        }
        return createQaEvaluation({ ...args, decisionData }, caller)
      }),
  )

  server.registerTool(
    'qa_evaluations_update',
    {
      description:
        'Edit the comment (body) of a user evaluation; the status cannot change. ' +
        'Only the author (here: the API token owner) may do this.',
      inputSchema: { regionSlug: regionSlugInput, evaluationId: idInput, body: z.string() },
    },
    (args) => run(() => updateQaEvaluationBody(args, caller)),
  )
}
