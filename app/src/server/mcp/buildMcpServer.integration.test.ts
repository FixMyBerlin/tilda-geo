import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import db from '@/server/db.server'
import { buildMcpServer } from '@/server/mcp/buildMcpServer'
import { isIntegrationDbAvailable } from '../../../test/integrationDb'

const integrationDb = await isIntegrationDbAvailable()

const ADMIN_USER_ID = 'vitest-mcp-admin'
const CATEGORY_GROUP = 'vitest-mcp-group'
const CONTRACT_SLUG = 'vitest-mcp-contract'
const REGION_SLUG = 'vitest-mcp-region'

async function connectClient() {
  const server = buildMcpServer({
    auth: { tokenId: 'vitest-mcp-token', createdById: ADMIN_USER_ID, changeSource: 'API' },
    request: new Request('http://localhost/mcp', { method: 'POST' }),
  })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  await server.connect(serverTransport)
  const client = new Client({ name: 'vitest', version: '1.0.0' })
  await client.connect(clientTransport)
  return client
}

async function callTool(client: Client, name: string, args: Record<string, unknown> = {}) {
  const result = await client.callTool({ name, arguments: args })
  const [content] = result.content as { type: 'text'; text: string }[]
  const text = content?.text ?? ''
  return {
    isError: result.isError === true,
    text,
    json: () => JSON.parse(text) as Record<string, unknown>,
  }
}

async function cleanup() {
  await db.mapDatasetCategory.deleteMany({ where: { groupKey: CATEGORY_GROUP } })
  await db.region.deleteMany({ where: { slug: REGION_SLUG } })
  await db.regionContract.deleteMany({ where: { slug: CONTRACT_SLUG } })
  await db.user.deleteMany({ where: { id: ADMIN_USER_ID } })
}

describe.skipIf(!integrationDb)('admin MCP tools (integration)', () => {
  let client: Client

  beforeAll(async () => {
    await cleanup()
    await db.user.create({
      data: {
        id: ADMIN_USER_ID,
        email: 'vitest-mcp-admin@users.openstreetmap.invalid',
        osmId: 1_900_000_010,
        osmName: 'vitest-mcp-admin',
        role: 'ADMIN',
      },
    })
    await db.region.create({
      data: {
        slug: REGION_SLUG,
        name: REGION_SLUG,
        fullName: REGION_SLUG,
        categoryAssignments: { create: { categoryId: 'poi', sortOrder: 0 } },
      },
    })
    client = await connectClient()
  })

  afterAll(async () => {
    await client?.close()
    await cleanup()
  })

  test('map_dataset_categories_* round-trip', async () => {
    const created = await callTool(client, 'map_dataset_categories_create', {
      groupKey: CATEGORY_GROUP,
      categoryKey: 'first',
      sortOrder: 1,
      title: 'First',
    })
    expect(created.isError).toBe(false)
    expect(created.json()).toMatchObject({ key: `${CATEGORY_GROUP}/first`, subtitle: null })

    const invalid = await callTool(client, 'map_dataset_categories_create', {
      groupKey: CATEGORY_GROUP,
      categoryKey: 'a/b',
      sortOrder: 1,
      title: 'Invalid',
    })
    expect(invalid.isError).toBe(true)

    const list = await callTool(client, 'map_dataset_categories_list')
    expect(list.text).toContain(`${CATEGORY_GROUP}/first`)

    const updated = await callTool(client, 'map_dataset_categories_update', {
      key: `${CATEGORY_GROUP}/first`,
      groupKey: CATEGORY_GROUP,
      categoryKey: 'renamed',
      sortOrder: 2,
      title: 'Renamed',
      subtitle: 'Sub',
    })
    expect(updated.json()).toMatchObject({ key: `${CATEGORY_GROUP}/renamed`, subtitle: 'Sub' })

    const got = await callTool(client, 'map_dataset_categories_get', {
      key: `${CATEGORY_GROUP}/renamed`,
    })
    expect(got.json()).toMatchObject({ title: 'Renamed', sortOrder: 2 })

    const deleted = await callTool(client, 'map_dataset_categories_delete', {
      key: `${CATEGORY_GROUP}/renamed`,
    })
    expect(deleted.isError).toBe(false)

    const missing = await callTool(client, 'map_dataset_categories_get', {
      key: `${CATEGORY_GROUP}/renamed`,
    })
    expect(missing.isError).toBe(true)

    const audit = await db.auditLog.findFirst({
      where: { model: 'MapDatasetCategory', userId: ADMIN_USER_ID },
      orderBy: { createdAt: 'desc' },
    })
    expect(audit).not.toBeNull()
  })

  test('region_contracts_* round-trip', async () => {
    const created = await callTool(client, 'region_contracts_create', {
      slug: CONTRACT_SLUG,
      name: 'Vitest MCP contract',
      status: 'ACTIVE',
      regionSlugs: [REGION_SLUG],
    })
    expect(created.isError).toBe(false)
    expect(created.json()).toMatchObject({ slug: CONTRACT_SLUG, regionSlugs: [REGION_SLUG] })

    const list = await callTool(client, 'region_contracts_list')
    expect(list.text).toContain(CONTRACT_SLUG)

    const blockedDelete = await callTool(client, 'region_contracts_delete', { slug: CONTRACT_SLUG })
    expect(blockedDelete.isError).toBe(true)

    const updated = await callTool(client, 'region_contracts_update', {
      slug: CONTRACT_SLUG,
      name: 'Vitest MCP contract renamed',
      status: 'ACTIVE',
      regionSlugs: [],
    })
    expect(updated.json()).toMatchObject({ name: 'Vitest MCP contract renamed', regionSlugs: [] })

    const got = await callTool(client, 'region_contracts_get', { slug: CONTRACT_SLUG })
    expect(got.json()).toMatchObject({ regionCount: 0 })

    const deleted = await callTool(client, 'region_contracts_delete', { slug: CONTRACT_SLUG })
    expect(deleted.isError).toBe(false)
  })
})
