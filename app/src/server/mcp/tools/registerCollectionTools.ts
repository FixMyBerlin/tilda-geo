import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { run } from '@/server/mcp/mcpToolResult'
import { idInput, regionSlugInput } from './mcpToolInputs'

type CollectionTools = {
  /** Tool name prefix, e.g. `note_folders` → `note_folders_list`. */
  prefix: string
  /** Singular name for the descriptions, e.g. `note folder (Ordner)`. */
  noun: string
  /** What a collection holds, e.g. `notes`. */
  contents: string
  list: (input: { regionSlug: string }) => Promise<unknown>
  create: (input: { regionSlug: string; name: string }) => Promise<unknown>
  /** Admin form state of the full-replace update (name + region links). */
  update: (input: {
    id: number
    name: string
    regionSlugs: string[]
  }) => Promise<{ success: boolean; message: string }>
  remove: (input: { regionSlug: string; id: number }) => Promise<unknown>
}

/**
 * Note folders and review lists are the same kind of thing: a named collection linked to regions
 * that members create and delete from within one region, and that admins rename and link to
 * regions. This registers that tool set once for both.
 */
export function registerCollectionTools(server: McpServer, tools: CollectionTools) {
  const { prefix, noun, contents } = tools
  const name = z.string().trim().min(1)

  server.registerTool(
    `${prefix}_list`,
    {
      description:
        `List the ${noun}s linked to a region, each with its id, name, number of ${contents} and ` +
        'all regions it is linked to.',
      inputSchema: { regionSlug: regionSlugInput },
    },
    (args) => run(() => tools.list(args)),
  )

  server.registerTool(
    `${prefix}_create`,
    {
      description: `Create a ${noun} linked to the region. Returns { id, name }.`,
      inputSchema: { regionSlug: regionSlugInput, name },
    },
    (args) => run(() => tools.create(args)),
  )

  server.registerTool(
    `${prefix}_update`,
    {
      description:
        `Rename a ${noun} and set the regions it is linked to. Full replace: regions missing from ` +
        `regionSlugs are unlinked, and its ${contents} are then no longer visible there. Take the ` +
        `current regions from ${prefix}_list.`,
      inputSchema: {
        id: idInput,
        name,
        regionSlugs: z.array(z.string().min(1)).min(1),
      },
    },
    (args) =>
      run(async () => {
        const input = { ...args, regionSlugs: [...new Set(args.regionSlugs)] }
        const result = await tools.update(input)
        if (!result.success) {
          throw new Error(
            `${result.message} — check that the id and every region slug exist (regions_list).`,
          )
        }
        return input
      }),
  )

  server.registerTool(
    `${prefix}_delete`,
    {
      description:
        `Delete a ${noun}. Only works when it has no ${contents} and is linked to this region ` +
        `only — move or delete its ${contents} first, and unlink other regions with ${prefix}_update.`,
      inputSchema: { regionSlug: regionSlugInput, id: idInput },
    },
    (args) => run(() => tools.remove(args)),
  )
}
