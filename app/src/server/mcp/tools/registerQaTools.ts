import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { notFound } from '@tanstack/react-router'
import { z } from 'zod'
import type { AdminApiCaller } from '@/server/auth/memberCaller.server'
import { run } from '@/server/mcp/mcpToolResult'
import { createQaConfigWithData } from '@/server/qa-configs/mutations/createQaConfig.server'
import {
  CreateQaEvaluationsSchema,
  createQaEvaluations,
} from '@/server/qa-configs/mutations/createQaEvaluations.server'
import { deleteQaConfig } from '@/server/qa-configs/mutations/deleteQaConfig.server'
import { updateQaConfigWithData } from '@/server/qa-configs/mutations/updateQaConfig.server'
import { updateQaEvaluationBody } from '@/server/qa-configs/mutations/updateQaEvaluationBody.server'
import {
  QA_AREA_LIST_LIMIT_ALL,
  QA_AREA_LIST_LIMIT_VIEW,
} from '@/server/qa-configs/qaAreaList.const'
import { getQaAreaList, QaAreaListSchema } from '@/server/qa-configs/queries/getQaAreaList.server'
import { getQaConfig } from '@/server/qa-configs/queries/getQaConfig.server'
import { getQaConfigsForAdmin } from '@/server/qa-configs/queries/getQaConfigsForAdmin.server'
import { getQaConfigStatsForAdmin } from '@/server/qa-configs/queries/getQaConfigStatsForAdmin.server'
import { getQaDecisionDataForArea } from '@/server/qa-configs/queries/getQaDecisionDataForArea.server'
import {
  CreateQaConfigFormSchema,
  qaConfigToFormValues,
  UpdateQaConfigFormSchema,
} from '@/server/qa-configs/schemas'
import { idInput, regionSlugInput } from './mcpToolInputs'

const configFieldsDescription =
  'The fields are the values of the admin form (/admin/qa-configs), validated the same way: ' +
  'regionId (see qa_configs_list or regions_get), slug, label, isActive "true"|"false", ' +
  'dataset parking_euvm|bikelanes, mapTable "public.<name>" (written by processing), areaTable ' +
  'and referenceTable "data.<name>" (areaTable must exist), areaFilter ' +
  'all|priority|non_priority|with_reference, referenceFrozenAt "YYYY-MM-DD", trustedOsmUsernames ' +
  '(one OSM name per line), mapAttribution (optional) and indicators [{ key, label, ' +
  'goodThreshold, needsReviewThreshold, absoluteDifferenceThreshold }] with the thresholds as ' +
  'text, the first two in percent ("10" = 10 %). key is "total" or an attribute of the dataset. ' +
  'Two active configs may not share a mapTable.'

const configSlugInput = z.string().min(1).describe('Slug of the QA config (see qa_configs_list).')
const areaIdInput = z.string().min(1).describe('Id of the cell (areaId in qa_areas_list).')

/** QA configs and evaluations ("Qualitätssicherung") — the same functions the admin and region UI call. */
export function registerQaTools(server: McpServer, caller: AdminApiCaller) {
  server.registerTool(
    'qa_configs_list',
    {
      description:
        'List QA configs (Qualitätssicherung) with their region, indicators (thresholds as ' +
        'fractions) and number of evaluations, ordered by region and slug. Optional regionSlug filter.',
      inputSchema: { regionSlug: z.string().min(1).optional() },
    },
    (args) => run(() => getQaConfigsForAdmin(args, caller)),
  )

  server.registerTool(
    'qa_configs_get',
    {
      description:
        'Get one QA config by id as { qaConfig, config, stats }: the stored row, the same config ' +
        'as form values (use it for qa_configs_update) and the number of cells per current status.',
      inputSchema: { id: idInput },
    },
    ({ id }) =>
      run(async () => {
        const qaConfig = await getQaConfig({ id }, caller)
        return {
          qaConfig,
          config: qaConfigToFormValues(qaConfig),
          stats: await getQaConfigStatsForAdmin({ configId: id }, caller),
        }
      }),
  )

  server.registerTool(
    'qa_configs_create',
    {
      description: `Create a QA config for a region. Returns { id }. ${configFieldsDescription}`,
      inputSchema: CreateQaConfigFormSchema.shape,
    },
    (args) =>
      run(async () => {
        const result = await createQaConfigWithData(args, caller)
        if (!result.success) throw new Error(result.message)
        return result.data
      }),
  )

  server.registerTool(
    'qa_configs_update',
    {
      description:
        'Update a QA config by id. Full replace of all fields; take them from `config` of ' +
        `qa_configs_get. ${configFieldsDescription}`,
      inputSchema: UpdateQaConfigFormSchema.shape,
    },
    (args) =>
      run(async () => {
        const result = await updateQaConfigWithData(args, caller)
        if (!result.success) throw new Error(result.message)
        return { id: args.id }
      }),
  )

  server.registerTool(
    'qa_configs_delete',
    {
      description: 'Delete a QA config by id. Fails while it has evaluations.',
      inputSchema: { id: idInput },
    },
    (args) => run(() => deleteQaConfig(args, caller)),
  )

  server.registerTool(
    'qa_areas_list',
    {
      description:
        'List the cells of a QA config with their latest evaluation (areaId, bbox, center, ' +
        'systemStatus, userStatus, evaluatorType, author, commentCount), biggest change first. ' +
        `Returns { items, totalCount, limit }: at most ${QA_AREA_LIST_LIMIT_ALL} items, or ` +
        `${QA_AREA_LIST_LIMIT_VIEW} with a bbox ([minLng, minLat, maxLng, maxLat] in WGS84). ` +
        'Optional filters: status, indicatorKeys, userIds (author of the latest evaluation) and ' +
        'search (comments).',
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
        'One cell of a QA config: per indicator the current values (decisionData), system and ' +
        'user status and the history of all evaluations, newest first, with author and comment.',
      inputSchema: {
        regionSlug: regionSlugInput,
        configSlug: configSlugInput,
        areaId: areaIdInput,
      },
    },
    (args) =>
      run(async () => {
        const cell = await getQaDecisionDataForArea(args, caller)
        if (!cell) throw notFound()
        return cell
      }),
  )

  server.registerTool(
    'qa_evaluations_create',
    {
      description:
        'Store a user decision for one cell: a userStatus per indicator in decisions and one ' +
        'optional comment (Markdown) for all of them. Each decision adds an evaluation to the ' +
        'history, attributed to the API token owner. Returns the created evaluations; an ' +
        'indicator the config or the cell does not have is skipped.',
      inputSchema: {
        ...CreateQaEvaluationsSchema.shape,
        regionSlug: regionSlugInput,
        configSlug: configSlugInput,
        areaId: areaIdInput,
      },
    },
    (args) =>
      run(async () => {
        const created = await createQaEvaluations(args, caller)
        if (created.length === 0) {
          throw new Error('Nothing stored: the config or the cell has none of these indicators.')
        }
        return created
      }),
  )

  server.registerTool(
    'qa_evaluations_update',
    {
      description:
        'Edit the comment (Markdown) of a user evaluation; the status stays. Only the author ' +
        '(here: the API token owner) may do this.',
      inputSchema: { regionSlug: regionSlugInput, evaluationId: idInput, body: z.string() },
    },
    (args) => run(() => updateQaEvaluationBody(args, caller)),
  )
}
