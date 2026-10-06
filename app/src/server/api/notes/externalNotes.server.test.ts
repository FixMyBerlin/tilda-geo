import { createHash } from 'node:crypto'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'

const db = vi.hoisted(() => ({
  externalApiToken: { findUnique: vi.fn(), update: vi.fn() },
  region: { findFirst: vi.fn(), findFirstOrThrow: vi.fn() },
  membership: { findFirst: vi.fn(), count: vi.fn() },
  noteFolder: { findFirst: vi.fn() },
  note: {
    findFirst: vi.fn(),
    findFirstOrThrow: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  noteComment: { create: vi.fn() },
}))
const auditContexts = vi.hoisted(() => [] as unknown[])

vi.mock('@/server/db.server', () => ({ default: db }))
// The session must come from the token only: a cookie session would be a bug in these routes.
vi.mock('@/server/auth/session.server', () => ({
  requireAuth: vi.fn(() => {
    throw new Error('cookie session must not be used')
  }),
  getAppSession: vi.fn(() => {
    throw new Error('cookie session must not be used')
  }),
}))
vi.mock('@/server/audit/auditContext.server', () => ({
  memberFormAuditContext: vi.fn(),
  runWithAuditContextAsync: (context: unknown, fn: () => unknown) => {
    auditContexts.push(context)
    return fn()
  },
}))

import {
  createExternalNote,
  createExternalNoteComment,
  getExternalNote,
  listExternalNotes,
  updateExternalNote,
} from '@/server/api/notes/externalNotes.server'
import { externalApiPreflightResponse } from '@/server/api/util/externalApiCors.server'
import { handleExternalApiRequest } from '@/server/api/util/externalApiResponses.server'

const ID_ORIGIN = 'http://127.0.0.1:8080'
const TOKEN = 'tildageode_ext_test'
const BASE = 'https://tilda-geo.de/api/notes/berlin/7'
const folderParams = { regionSlug: 'berlin', folderId: '7' }
const noteParams = { ...folderParams, noteId: '42' }

const author = { id: 'user-1', osmName: 'mapper', firstName: 'Mia', lastName: 'M', role: 'USER' }
const note = {
  id: 42,
  createdAt: new Date('2026-10-01T08:00:00Z'),
  updatedAt: new Date('2026-10-01T08:00:00Z'),
  userId: 'user-1',
  folderId: 7,
  author,
  subject: 'Radweg fehlt',
  body: 'Bitte prüfen',
  resolvedAt: null,
  latitude: 52.5,
  longitude: 13.4,
  noteComments: [],
  folder: { regions: [{ id: 11 }] },
}

function request(url: string, init: RequestInit & { token?: string | null; origin?: string } = {}) {
  const { token = TOKEN, origin = ID_ORIGIN, ...rest } = init
  return new Request(url, {
    ...rest,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(origin ? { Origin: origin } : {}),
      'Content-Type': 'application/json',
    },
  })
}

async function run(req: Request, handler: () => Promise<unknown>) {
  const response = await handleExternalApiRequest(req, async () => ({
    status: 200,
    body: await handler(),
  }))
  return { response, body: await response.json() }
}

function tokenRow(overrides: { expiresAt?: Date; scope?: string; role?: UserRoleEnum } = {}) {
  return {
    id: 'token-1',
    scope: overrides.scope ?? 'notes',
    expiresAt: overrides.expiresAt ?? new Date(Date.now() + 60_000),
    lastUsedAt: new Date(),
    user: { id: 'user-1', role: overrides.role ?? UserRoleEnum.USER },
  }
}

function asMember(isMember: boolean) {
  db.membership.count.mockResolvedValue(isMember ? 1 : 0)
  db.membership.findFirst.mockResolvedValue(isMember ? { id: 1 } : null)
}

beforeEach(() => {
  auditContexts.length = 0
  for (const model of Object.values(db)) {
    for (const fn of Object.values(model)) fn.mockReset()
  }
  db.externalApiToken.findUnique.mockResolvedValue(tokenRow())
  db.region.findFirst.mockResolvedValue({ id: 11, slug: 'berlin', status: 'PUBLIC' })
  db.region.findFirstOrThrow.mockResolvedValue({ id: 11 })
  db.noteFolder.findFirst.mockResolvedValue({ id: 7 })
  db.note.findFirst.mockResolvedValue(note)
  db.note.findFirstOrThrow.mockResolvedValue(note)
  db.note.findMany.mockResolvedValue([note])
  asMember(true)
})

describe('external notes API: who may', () => {
  test('member reads the folder as GeoJSON; the token is looked up by its hash', async () => {
    const req = request(BASE)
    const { response, body } = await run(req, () => listExternalNotes(req, folderParams))

    expect(response.status).toBe(200)
    expect(body.type).toBe('FeatureCollection')
    expect(body.features[0].properties).toMatchObject({
      id: 42,
      status: 'open',
      subject: 'Radweg fehlt',
      authorName: 'Mia M',
      commentCount: 0,
      isAuthor: true,
    })
    expect(db.externalApiToken.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { hashedToken: createHash('sha256').update(TOKEN).digest('hex') },
      }),
    )
  })

  test('non-member gets 403 not_member, also on a PUBLIC region, and no notes are read', async () => {
    asMember(false)
    const req = request(BASE)
    const { response, body } = await run(req, () => listExternalNotes(req, folderParams))

    expect(response.status).toBe(403)
    expect(body.error).toBe('not_member')
    expect(db.note.findMany).not.toHaveBeenCalled()
  })

  test('non-member cannot write', async () => {
    asMember(false)
    const req = request(BASE, {
      method: 'POST',
      body: JSON.stringify({ subject: 'x', latitude: 52.5, longitude: 13.4 }),
    })
    const { response, body } = await run(req, () => createExternalNote(req, folderParams))

    expect(response.status).toBe(403)
    expect(body.error).toBe('not_member')
    expect(db.note.create).not.toHaveBeenCalled()
  })

  test('admin needs no membership', async () => {
    asMember(false)
    db.externalApiToken.findUnique.mockResolvedValue(tokenRow({ role: UserRoleEnum.ADMIN }))
    const req = request(BASE)
    const { response } = await run(req, () => listExternalNotes(req, folderParams))

    expect(response.status).toBe(200)
  })

  test('unknown region is 404 region_not_found', async () => {
    db.region.findFirst.mockResolvedValue(null)
    const req = request(BASE)
    const { response, body } = await run(req, () => listExternalNotes(req, folderParams))

    expect(response.status).toBe(404)
    expect(body.error).toBe('region_not_found')
  })

  test('folder that is not linked to the region is 404 and nothing is read or written', async () => {
    db.noteFolder.findFirst.mockResolvedValue(null)

    const list = request(BASE)
    const listed = await run(list, () => listExternalNotes(list, folderParams))
    expect(listed.response.status).toBe(404)
    expect(listed.body.error).toBe('folder_not_found')
    expect(db.noteFolder.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 7, regions: { some: { slug: 'berlin' } } } }),
    )

    const create = request(BASE, {
      method: 'POST',
      body: JSON.stringify({ subject: 'x', latitude: 52.5, longitude: 13.4 }),
    })
    const created = await run(create, () => createExternalNote(create, folderParams))
    expect(created.body.error).toBe('folder_not_found')
    expect(db.note.findMany).not.toHaveBeenCalled()
    expect(db.note.create).not.toHaveBeenCalled()
  })

  test('note of another folder is 404 note_not_found and is not changed', async () => {
    db.note.findFirst.mockResolvedValue(null)
    const req = request(`${BASE}/42`, { method: 'PATCH', body: JSON.stringify({ resolved: true }) })
    const { response, body } = await run(req, () => updateExternalNote(req, noteParams))

    expect(response.status).toBe(404)
    expect(body.error).toBe('note_not_found')
    expect(db.note.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 42, folderId: 7 } }),
    )
    expect(db.note.update).not.toHaveBeenCalled()
  })
})

describe('external notes API: token', () => {
  test('expired token is 401 token_expired', async () => {
    db.externalApiToken.findUnique.mockResolvedValue(
      tokenRow({ expiresAt: new Date(Date.now() - 1000) }),
    )
    const req = request(BASE)
    const { response, body } = await run(req, () => listExternalNotes(req, folderParams))

    expect(response.status).toBe(401)
    expect(body.error).toBe('token_expired')
    expect(db.note.findMany).not.toHaveBeenCalled()
  })

  test('unknown token, token of another scope and missing token are 401', async () => {
    db.externalApiToken.findUnique.mockResolvedValue(null)
    const unknown = request(BASE)
    expect((await run(unknown, () => listExternalNotes(unknown, folderParams))).body.error).toBe(
      'invalid_token',
    )

    db.externalApiToken.findUnique.mockResolvedValue(tokenRow({ scope: 'other' }))
    const otherScope = request(BASE)
    expect(
      (await run(otherScope, () => listExternalNotes(otherScope, folderParams))).body.error,
    ).toBe('invalid_token')

    const missing = request(BASE, { token: null })
    const result = await run(missing, () => listExternalNotes(missing, folderParams))
    expect(result.response.status).toBe(401)
    expect(result.body.error).toBe('missing_token')
  })

  test('an admin API token is not accepted', async () => {
    const req = request(BASE, { token: 'tildageode_admin_abc' })
    const { response } = await run(req, () => listExternalNotes(req, folderParams))

    expect(response.status).toBe(401)
    expect(db.externalApiToken.findUnique).not.toHaveBeenCalled()
  })
})

describe('external notes API: CORS', () => {
  test('wrong origin is rejected before the token is looked at', async () => {
    const req = request(BASE, { origin: 'https://evil.example' })
    const { response, body } = await run(req, () => listExternalNotes(req, folderParams))

    expect(response.status).toBe(403)
    expect(body.error).toBe('origin_not_allowed')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
    expect(db.externalApiToken.findUnique).not.toHaveBeenCalled()
  })

  test('allowed origin is echoed, also on errors', async () => {
    const ok = request(BASE)
    const okResult = await run(ok, () => listExternalNotes(ok, folderParams))
    expect(okResult.response.headers.get('Access-Control-Allow-Origin')).toBe(ID_ORIGIN)
    expect(okResult.response.headers.get('Vary')).toBe('Origin')

    asMember(false)
    const denied = request(BASE)
    const deniedResult = await run(denied, () => listExternalNotes(denied, folderParams))
    expect(deniedResult.response.headers.get('Access-Control-Allow-Origin')).toBe(ID_ORIGIN)
  })

  test('preflight: allowed origin gets methods and the Authorization header, others 403', () => {
    const allowed = externalApiPreflightResponse(
      request(BASE, { method: 'OPTIONS', token: null, origin: 'http://127.0.0.1:8080' }),
    )
    expect(allowed.status).toBe(204)
    expect(allowed.headers.get('Access-Control-Allow-Origin')).toBe('http://127.0.0.1:8080')
    expect(allowed.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PATCH, OPTIONS')
    expect(allowed.headers.get('Access-Control-Allow-Headers')).toContain('Authorization')

    const denied = externalApiPreflightResponse(
      request(BASE, { method: 'OPTIONS', token: null, origin: 'https://evil.example' }),
    )
    expect(denied.status).toBe(403)
    expect(denied.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })
})

describe('external notes API: reads and writes', () => {
  test('list filters by status and bbox', async () => {
    const closed = request(`${BASE}?status=closed`)
    expect(
      (await run(closed, () => listExternalNotes(closed, folderParams))).body.features,
    ).toEqual([])

    const inside = request(`${BASE}?bbox=13,52,14,53`)
    expect(
      (await run(inside, () => listExternalNotes(inside, folderParams))).body.features,
    ).toHaveLength(1)

    const outside = request(`${BASE}?bbox=8,48,9,49`)
    expect(
      (await run(outside, () => listExternalNotes(outside, folderParams))).body.features,
    ).toEqual([])

    const invalid = request(`${BASE}?bbox=1,2,3`)
    const result = await run(invalid, () => listExternalNotes(invalid, folderParams))
    expect(result.response.status).toBe(400)
    expect(result.body.error).toBe('invalid_input')
  })

  test('note detail has body, status and comments with author names', async () => {
    db.note.findFirst.mockResolvedValue({
      ...note,
      noteComments: [
        {
          id: 5,
          noteId: 42,
          createdAt: new Date('2026-10-01T09:00:00Z'),
          updatedAt: new Date('2026-10-01T09:00:00Z'),
          body: 'Erledigt?',
          author: { ...author, id: 'user-2', firstName: null, lastName: null, osmName: 'other' },
        },
      ],
    })
    const req = request(`${BASE}/42`)
    const { body } = await run(req, () => getExternalNote(req, noteParams))

    expect(body).toMatchObject({
      id: 42,
      folderId: 7,
      subject: 'Radweg fehlt',
      body: 'Bitte prüfen',
      status: 'open',
      author: { id: 'user-1', name: 'Mia M' },
      isAuthor: true,
      comments: [{ id: 5, body: 'Erledigt?', author: { id: 'user-2', name: 'other' } }],
    })
    expect(body.comments[0].isAuthor).toBe(false)
  })

  test('create writes as the token user into the folder, audited as EXTERNAL_API', async () => {
    db.note.create.mockResolvedValue({ id: 42 })
    const req = request(BASE, {
      method: 'POST',
      body: JSON.stringify({ subject: 'Radweg fehlt', latitude: 52.5, longitude: 13.4 }),
    })
    const { response } = await run(req, () => createExternalNote(req, folderParams))

    expect(response.status).toBe(200)
    expect(db.note.create).toHaveBeenCalledWith({
      data: {
        subject: 'Radweg fehlt',
        latitude: 52.5,
        longitude: 13.4,
        folderId: 7,
        userId: 'user-1',
      },
    })
    expect(auditContexts).toEqual([
      expect.objectContaining({
        userId: 'user-1',
        metadata: { changeSource: 'EXTERNAL_API', externalTokenId: 'token-1' },
      }),
    ])
  })

  test('create rejects a body that is not a note', async () => {
    const req = request(BASE, {
      method: 'POST',
      body: JSON.stringify({ subject: 'x', latitude: '52.5' }),
    })
    const { response, body } = await run(req, () => createExternalNote(req, folderParams))

    expect(response.status).toBe(400)
    expect(body.error).toBe('invalid_input')
    expect(db.note.create).not.toHaveBeenCalled()
  })

  test('comment and resolve write as the token user', async () => {
    const comment = request(`${BASE}/42/comments`, {
      method: 'POST',
      body: JSON.stringify({ body: 'Danke' }),
    })
    await run(comment, () => createExternalNoteComment(comment, noteParams))
    expect(db.noteComment.create).toHaveBeenCalledWith({
      data: { noteId: 42, body: 'Danke', userId: 'user-1' },
    })

    const resolve = request(`${BASE}/42`, {
      method: 'PATCH',
      body: JSON.stringify({ resolved: true }),
    })
    await run(resolve, () => updateExternalNote(resolve, noteParams))
    expect(db.note.update).toHaveBeenCalledWith({
      where: { id: 42 },
      data: { resolvedAt: expect.any(Date) },
    })
  })
})
