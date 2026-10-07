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
const PRIVATE_BACKGROUND_SLUG = 'vitest-mcp-private-background'
const REGION_SLUG = 'vitest-mcp-region'
const SECOND_REGION_SLUG = 'vitest-mcp-region-2'
const OTHER_USER_ID = 'vitest-mcp-other'
const UPLOAD_SLUG = 'vitest-mcp-upload'
const SECOND_UPLOAD_SLUG = 'vitest-mcp-upload-2'

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
  const inRegion = { regions: { some: { slug: REGION_SLUG } } }
  await db.note.deleteMany({ where: { folder: inRegion } })
  await db.noteFolder.deleteMany({ where: inRegion })
  await db.reviewList.deleteMany({ where: inRegion })
  await db.mapDatasetUpload.deleteMany({
    where: { slug: { in: [UPLOAD_SLUG, SECOND_UPLOAD_SLUG] } },
  })
  await db.mapDatasetCategory.deleteMany({ where: { groupKey: CATEGORY_GROUP } })
  await db.region.deleteMany({ where: { slug: { in: [REGION_SLUG, SECOND_REGION_SLUG] } } })
  await db.regionContract.deleteMany({ where: { slug: CONTRACT_SLUG } })
  await db.privateBackgroundSource.deleteMany({ where: { slug: PRIVATE_BACKGROUND_SLUG } })
  await db.user.deleteMany({ where: { id: { in: [ADMIN_USER_ID, OTHER_USER_ID] } } })
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
    await db.user.create({
      data: {
        id: OTHER_USER_ID,
        email: 'vitest-mcp-other@users.openstreetmap.invalid',
        osmId: 1_900_000_011,
        osmName: 'vitest-mcp-other',
        role: 'USER',
      },
    })
    for (const slug of [REGION_SLUG, SECOND_REGION_SLUG]) {
      await db.region.create({
        data: {
          slug,
          name: slug,
          fullName: slug,
          categoryAssignments: { create: { categoryId: 'poi', sortOrder: 0 } },
        },
      })
    }
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

  test('map_dataset_uploads_* list, get, remove region, delete', async () => {
    const categoryKey = `${CATEGORY_GROUP}/uploads`
    const config = {
      name: 'Vitest view',
      categoryKey,
      layers: [{ id: 'vitest-layer', type: 'line' }],
      inspector: { enabled: false },
    }
    const uploadData = {
      configs: [config],
      mapRenderFormat: 'geojson' as const,
      mapRenderUrl: 'https://example.com/vitest.geojson',
      githubUrl: 'https://example.com/vitest',
      dataUpdatedNote: '2026-01-01',
    }
    await db.mapDatasetUpload.create({
      data: {
        ...uploadData,
        slug: UPLOAD_SLUG,
        regions: { connect: [{ slug: REGION_SLUG }, { slug: SECOND_REGION_SLUG }] },
        layerConfigs: { create: [config] },
      },
    })
    await db.mapDatasetUpload.create({
      data: {
        ...uploadData,
        slug: SECOND_UPLOAD_SLUG,
        configs: [{ ...config, categoryKey: null }],
        regions: { connect: [{ slug: SECOND_REGION_SLUG }] },
        layerConfigs: { create: [{ ...config, categoryKey: null }] },
      },
    })

    const slugsOf = (result: Awaited<ReturnType<typeof callTool>>) =>
      (JSON.parse(result.text) as { slug: string }[]).map((upload) => upload.slug)

    const list = await callTool(client, 'map_dataset_uploads_list')
    expect(slugsOf(list)).toEqual(expect.arrayContaining([UPLOAD_SLUG, SECOND_UPLOAD_SLUG]))
    expect(JSON.parse(list.text)).toContainEqual({
      slug: UPLOAD_SLUG,
      public: false,
      createdBy: 'SCRIPT',
      updatedAt: expect.any(String),
      dataUpdatedNote: '2026-01-01',
      regionSlugs: [REGION_SLUG, SECOND_REGION_SLUG],
      configs: [{ name: 'Vitest view', categoryKey }],
    })

    const byRegion = await callTool(client, 'map_dataset_uploads_list', { regionSlug: REGION_SLUG })
    expect(slugsOf(byRegion)).toEqual([UPLOAD_SLUG])
    const byCategory = await callTool(client, 'map_dataset_uploads_list', { categoryKey })
    expect(slugsOf(byCategory)).toEqual([UPLOAD_SLUG])

    const got = await callTool(client, 'map_dataset_uploads_get', { slug: UPLOAD_SLUG })
    expect(got.json()).toMatchObject({
      slug: UPLOAD_SLUG,
      configs: [config],
      regionSlugs: [REGION_SLUG, SECOND_REGION_SLUG],
    })
    const missing = await callTool(client, 'map_dataset_uploads_get', { slug: 'vitest-mcp-nope' })
    expect(missing.text).toBe('Error: Map dataset upload not found: vitest-mcp-nope')

    const unlinked = await callTool(client, 'map_dataset_uploads_remove_region', {
      uploadSlug: UPLOAD_SLUG,
      regionSlug: REGION_SLUG,
    })
    expect(unlinked.json()).toEqual({ slug: UPLOAD_SLUG, regionSlugs: [SECOND_REGION_SLUG] })
    const unlinkedAudit = await db.auditLog.findFirst({
      where: { model: 'MapDatasetUpload', userId: ADMIN_USER_ID },
      orderBy: { createdAt: 'desc' },
    })
    expect(unlinkedAudit).toMatchObject({
      action: 'UPDATE',
      recordId: String(got.json().id),
      oldData: { regionSlugs: [REGION_SLUG, SECOND_REGION_SLUG] },
      newData: { regionSlugs: [SECOND_REGION_SLUG] },
      metadata: { changeSource: 'API' },
    })

    const unlinkedAgain = await callTool(client, 'map_dataset_uploads_remove_region', {
      uploadSlug: UPLOAD_SLUG,
      regionSlug: REGION_SLUG,
    })
    expect(unlinkedAgain.isError).toBe(true)
    expect(unlinkedAgain.text).toContain('is not linked to region')
    const unlinkUnknown = await callTool(client, 'map_dataset_uploads_remove_region', {
      uploadSlug: 'vitest-mcp-nope',
      regionSlug: REGION_SLUG,
    })
    expect(unlinkUnknown.text).toBe('Error: Map dataset upload not found: vitest-mcp-nope')

    const deleted = await callTool(client, 'map_dataset_uploads_delete', { slug: UPLOAD_SLUG })
    expect(deleted.isError).toBe(false)
    expect(deleted.json()).toMatchObject({
      slug: UPLOAD_SLUG,
      configs: [config],
      regionSlugs: [SECOND_REGION_SLUG],
    })
    expect(await db.mapDatasetUpload.findUnique({ where: { slug: UPLOAD_SLUG } })).toBeNull()
    expect(await db.mapDatasetUpload.count({ where: { slug: SECOND_UPLOAD_SLUG } })).toBe(1)
    expect(await db.region.count({ where: { slug: SECOND_REGION_SLUG } })).toBe(1)
    const deletedAudit = await db.auditLog.findMany({
      where: { model: 'MapDatasetUpload', recordId: String(got.json().id), userId: ADMIN_USER_ID },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 2,
    })
    // The DELETE row has columns only, so the dropped region links get their own row.
    expect(deletedAudit).toMatchObject([
      {
        action: 'UPDATE',
        oldData: { regionSlugs: [SECOND_REGION_SLUG] },
        newData: { regionSlugs: [] },
        metadata: { changeSource: 'API' },
      },
      { action: 'DELETE', metadata: { changeSource: 'API' } },
    ])

    const deletedAgain = await callTool(client, 'map_dataset_uploads_delete', { slug: UPLOAD_SLUG })
    expect(deletedAgain.isError).toBe(true)
    expect(deletedAgain.text).toBe(`Error: Map dataset upload not found: ${UPLOAD_SLUG}`)
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

  test('private_backgrounds_* round-trip never returns or audits the tile URL', async () => {
    const tilesUrl = 'https://tiles.example.com/{z}/{x}/{y}.jpg?token=VITEST_SECRET'
    const created = await callTool(client, 'private_backgrounds_create', {
      slug: PRIVATE_BACKGROUND_SLUG,
      name: 'Vitest MCP background',
      tilesUrl,
      regionSlugs: [REGION_SLUG],
    })
    expect(created.isError).toBe(false)
    expect(created.json()).toMatchObject({ tileSize: 256, regionSlugs: [REGION_SLUG] })

    const invalid = await callTool(client, 'private_backgrounds_create', {
      slug: `${PRIVATE_BACKGROUND_SLUG}-2`,
      name: 'No placeholders',
      tilesUrl: 'https://tiles.example.com/tile.jpg',
    })
    expect(invalid.isError).toBe(true)
    const zooms = await callTool(client, 'private_backgrounds_update', {
      slug: PRIVATE_BACKGROUND_SLUG,
      name: 'Zooms',
      minzoom: 18,
      maxzoom: 10,
    })
    expect(zooms.isError).toBe(true)

    // Without tilesUrl the stored URL stays; everything else is replaced.
    const updated = await callTool(client, 'private_backgrounds_update', {
      slug: PRIVATE_BACKGROUND_SLUG,
      name: 'Vitest MCP background renamed',
      maxzoom: 21,
      regionSlugs: [],
    })
    expect(updated.json()).toMatchObject({ name: 'Vitest MCP background renamed', regionSlugs: [] })
    const stored = await db.privateBackgroundSource.findUniqueOrThrow({
      where: { slug: PRIVATE_BACKGROUND_SLUG },
    })
    expect(stored).toMatchObject({ tilesUrl, maxzoom: 21 })

    // Rotating the token shows up in the audit log as a changed marker, never as the URL.
    await callTool(client, 'private_backgrounds_update', {
      slug: PRIVATE_BACKGROUND_SLUG,
      name: 'Vitest MCP background renamed',
      tilesUrl: `${tilesUrl}_ROTATED`,
    })
    const rotated = await db.privateBackgroundSource.findUniqueOrThrow({
      where: { slug: PRIVATE_BACKGROUND_SLUG },
    })
    expect(rotated.tilesUrlChangedAt.getTime()).toBeGreaterThan(stored.tilesUrlChangedAt.getTime())

    const list = await callTool(client, 'private_backgrounds_list')
    expect(list.text).toContain(PRIVATE_BACKGROUND_SLUG)
    const audit = await db.auditLog.findMany({
      where: { model: 'PrivateBackgroundSource', recordId: String(stored.id) },
    })
    expect(audit.length).toBeGreaterThan(0)
    // Unlinking the region is recorded: the regions decide who may load the tiles.
    const regionLinkRows = audit.filter((row) =>
      JSON.stringify(row.newData).includes('regionSlugs'),
    )
    expect(regionLinkRows.map((row) => row.newData)).toEqual(
      expect.arrayContaining([{ regionSlugs: [REGION_SLUG] }, { regionSlugs: [] }]),
    )
    expect(regionLinkRows).toHaveLength(2)
    expect([created.text, updated.text, list.text, JSON.stringify(audit)].join()).not.toContain(
      'VITEST_SECRET',
    )

    const deleted = await callTool(client, 'private_backgrounds_delete', {
      slug: PRIVATE_BACKGROUND_SLUG,
    })
    expect(deleted.isError).toBe(false)
  })

  test('note_folders_* / notes_* / note_comments_* round-trip', async () => {
    const folder = await callTool(client, 'note_folders_create', {
      regionSlug: REGION_SLUG,
      name: 'MCP folder',
    })
    expect(folder.isError).toBe(false)
    const folderId = folder.json().id as number

    const linked = await callTool(client, 'note_folders_update', {
      id: folderId,
      name: 'MCP folder renamed',
      regionSlugs: [REGION_SLUG, SECOND_REGION_SLUG],
    })
    expect(linked.isError).toBe(false)
    const inSecondRegion = await callTool(client, 'note_folders_list', {
      regionSlug: SECOND_REGION_SLUG,
    })
    expect(JSON.parse(inSecondRegion.text)).toEqual([
      expect.objectContaining({ id: folderId, name: 'MCP folder renamed' }),
    ])
    const sharedDelete = await callTool(client, 'note_folders_delete', {
      regionSlug: REGION_SLUG,
      id: folderId,
    })
    expect(sharedDelete.text).toContain('mehreren Regionen')

    const unknownRegion = await callTool(client, 'note_folders_update', {
      id: folderId,
      name: 'MCP folder renamed',
      regionSlugs: ['vitest-mcp-missing'],
    })
    expect(unknownRegion.isError).toBe(true)
    expect(unknownRegion.text).toMatch(
      /^Error: An operation failed because .* check that the id and every region slug exist/,
    )
    const unlinked = await callTool(client, 'note_folders_update', {
      id: folderId,
      name: 'MCP folder renamed',
      regionSlugs: [REGION_SLUG],
    })
    expect(unlinked.json()).toMatchObject({ id: folderId, regionSlugs: [REGION_SLUG] })

    const created = await callTool(client, 'notes_create', {
      regionSlug: REGION_SLUG,
      folderId,
      subject: 'MCP note',
      body: 'Body',
      latitude: 52.5,
      longitude: 13.4,
    })
    expect(created.isError).toBe(false)
    const noteId = created.json().id as number

    const audit = await db.auditLog.findFirst({
      where: { model: 'Note', recordId: String(noteId) },
    })
    expect(audit).toMatchObject({
      userId: ADMIN_USER_ID,
      metadata: { changeSource: 'API', adminTokenId: 'vitest-mcp-token' },
    })

    const comment = await callTool(client, 'note_comments_create', {
      regionSlug: REGION_SLUG,
      noteId,
      body: 'Comment',
    })
    const commentId = comment.json().id as number
    const editedComment = await callTool(client, 'note_comments_update', {
      regionSlug: REGION_SLUG,
      commentId,
      body: 'Comment edited',
    })
    expect(editedComment.isError).toBe(false)

    const updated = await callTool(client, 'notes_update', {
      regionSlug: REGION_SLUG,
      noteId,
      subject: 'MCP note edited',
      body: 'Body edited',
      resolved: true,
    })
    expect(updated.isError).toBe(false)

    const got = await callTool(client, 'notes_get', { regionSlug: REGION_SLUG, noteId })
    expect(got.json()).toMatchObject({
      subject: 'MCP note edited',
      noteComments: [{ body: 'Comment edited' }],
    })
    expect(got.json().resolvedAt).not.toBeNull()

    const closed = await callTool(client, 'notes_list', {
      regionSlug: REGION_SLUG,
      folderId,
      status: 'closed',
    })
    expect(closed.text).toContain('MCP note edited')
    const open = await callTool(client, 'notes_list', {
      regionSlug: REGION_SLUG,
      folderId,
      status: 'open',
    })
    expect(open.text).not.toContain('MCP note edited')

    const blockedFolderDelete = await callTool(client, 'note_folders_delete', {
      regionSlug: REGION_SLUG,
      id: folderId,
    })
    expect(blockedFolderDelete.text).toContain('Nur leere Ordner')

    const second = await callTool(client, 'note_folders_create', {
      regionSlug: REGION_SLUG,
      name: 'MCP second folder',
    })
    const secondFolderId = second.json().id as number
    const moved = await callTool(client, 'notes_move', {
      regionSlug: REGION_SLUG,
      noteId,
      folderId: secondFolderId,
    })
    expect(moved.json()).toMatchObject({ folderId: secondFolderId })

    const folders = await callTool(client, 'note_folders_list', { regionSlug: REGION_SLUG })
    expect(JSON.parse(folders.text)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: folderId, noteCount: 0 }),
        expect.objectContaining({ id: secondFolderId, noteCount: 1 }),
      ]),
    )

    const deletedComment = await callTool(client, 'note_comments_delete', {
      regionSlug: REGION_SLUG,
      commentId,
    })
    expect(deletedComment.isError).toBe(false)
    const deletedNote = await callTool(client, 'notes_delete', { regionSlug: REGION_SLUG, noteId })
    expect(deletedNote.isError).toBe(false)
    for (const id of [folderId, secondFolderId]) {
      const deleted = await callTool(client, 'note_folders_delete', { regionSlug: REGION_SLUG, id })
      expect(deleted.isError).toBe(false)
    }
  })

  test('notes of another author: resolve works, edit and delete are rejected', async () => {
    const folder = await db.noteFolder.create({
      data: { name: 'MCP foreign', regions: { connect: { slug: REGION_SLUG } } },
    })
    const note = await db.note.create({
      data: {
        folderId: folder.id,
        userId: OTHER_USER_ID,
        subject: 'Foreign',
        latitude: 52.5,
        longitude: 13.4,
      },
    })
    const target = { regionSlug: REGION_SLUG, noteId: note.id }

    const resolved = await callTool(client, 'notes_set_resolved', { ...target, resolved: true })
    expect(resolved.isError).toBe(false)

    const edited = await callTool(client, 'notes_update', {
      ...target,
      subject: 'Hijacked',
      body: '',
      resolved: false,
    })
    expect(edited.isError).toBe(true)
    expect(edited.text).toContain('Not allowed: Only the author can update this note')
    expect(edited.text).toContain('admins get no bypass')
    const deleted = await callTool(client, 'notes_delete', target)
    expect(deleted.text).toContain('Not allowed: Only the author can delete this note')
    expect(await db.note.count({ where: { id: note.id, subject: 'Foreign' } })).toBe(1)

    const wrongRegion = { ...target, regionSlug: SECOND_REGION_SLUG }
    const getWrongRegion = await callTool(client, 'notes_get', wrongRegion)
    expect(getWrongRegion.text).toContain('Not allowed: Note does not belong to this region')
    const deleteWrongRegion = await callTool(client, 'notes_delete', wrongRegion)
    expect(deleteWrongRegion.text).toBe(
      'Error: Not found in this region (check the id and regionSlug)',
    )
  })

  test('review_lists_* / review_entries_* / review_entry_comments_* round-trip', async () => {
    const list = await callTool(client, 'review_lists_create', {
      regionSlug: REGION_SLUG,
      name: 'MCP list',
    })
    expect(list.isError).toBe(false)
    const listId = list.json().id as number

    const linked = await callTool(client, 'review_lists_update', {
      id: listId,
      name: 'MCP list renamed',
      regionSlugs: [REGION_SLUG, SECOND_REGION_SLUG],
    })
    expect(linked.json()).toMatchObject({ name: 'MCP list renamed' })
    const inSecondRegion = await callTool(client, 'review_lists_list', {
      regionSlug: SECOND_REGION_SLUG,
    })
    expect(JSON.parse(inSecondRegion.text)).toEqual([
      expect.objectContaining({ id: listId, name: 'MCP list renamed' }),
    ])
    await callTool(client, 'review_lists_update', {
      id: listId,
      name: 'MCP list renamed',
      regionSlugs: [REGION_SLUG],
    })

    const invalid = await callTool(client, 'review_entries_create', {
      regionSlug: REGION_SLUG,
      listId,
      geometry: { type: 'GeometryCollection', coordinates: [] },
    })
    expect(invalid.isError).toBe(true)

    const created = await callTool(client, 'review_entries_create', {
      regionSlug: REGION_SLUG,
      listId,
      geometry: { type: 'Point', coordinates: [13.4, 52.5] },
      properties: { name: 'Spot' },
    })
    expect(created.isError).toBe(false)
    const entryId = created.json().id as number

    const updated = await callTool(client, 'review_entries_update', {
      regionSlug: REGION_SLUG,
      entryId,
      status: 'PROBLEM',
    })
    expect(updated.json()).toMatchObject({ id: entryId, status: 'PROBLEM' })

    const comment = await callTool(client, 'review_entry_comments_create', {
      regionSlug: REGION_SLUG,
      entryId,
      body: 'Comment',
    })
    const editedComment = await callTool(client, 'review_entry_comments_update', {
      regionSlug: REGION_SLUG,
      commentId: comment.json().id,
      body: 'Comment edited',
    })
    expect(editedComment.isError).toBe(false)

    const got = await callTool(client, 'review_entries_get', { regionSlug: REGION_SLUG, entryId })
    expect(got.json()).toMatchObject({
      status: 'PROBLEM',
      properties: { name: 'Spot' },
      comments: [{ body: 'Comment edited' }],
    })

    const entries = await callTool(client, 'review_entries_list', {
      regionSlug: REGION_SLUG,
      listId,
    })
    expect(entries.json()).toMatchObject({
      featureCollection: {
        features: [{ geometry: { type: 'Point' }, properties: { id: entryId, commentCount: 1 } }],
      },
    })

    const blockedListDelete = await callTool(client, 'review_lists_delete', {
      regionSlug: REGION_SLUG,
      id: listId,
    })
    expect(blockedListDelete.isError).toBe(true)

    const deletedEntry = await callTool(client, 'review_entries_delete', {
      regionSlug: REGION_SLUG,
      entryId,
    })
    expect(deletedEntry.isError).toBe(false)
    const missing = await callTool(client, 'review_entries_get', {
      regionSlug: REGION_SLUG,
      entryId,
    })
    expect(missing.text).toBe('Error: Not found')

    const deletedList = await callTool(client, 'review_lists_delete', {
      regionSlug: REGION_SLUG,
      id: listId,
    })
    expect(deletedList.isError).toBe(false)
    const lists = await callTool(client, 'review_lists_list', { regionSlug: REGION_SLUG })
    expect(JSON.parse(lists.text)).toEqual([])
  })
})
