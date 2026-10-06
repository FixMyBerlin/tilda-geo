import { z } from 'zod'
import { requireExternalSession } from '@/server/api/auth/osmToken.server'
import { ExternalApiError, jsonBody } from '@/server/api/util/externalApiResponses.server'
import { canAccessMemberModeForRegion } from '@/server/authorization/canAccessMemberModeForRegion.server'
import db from '@/server/db.server'
import { createNote } from '@/server/notes/mutations/createNote.server'
import { createNoteComment } from '@/server/notes/mutations/createNoteComment.server'
import { updateNoteResolvedAt } from '@/server/notes/mutations/updateNoteResolvedAt.server'
import type { ExternalNotesCaller } from '@/server/notes/notesCaller.server'
import { getNoteAndComments } from '@/server/notes/queries/getNoteAndComments.server'
import { getNotesAndCommentsForRegion } from '@/server/notes/queries/getNotesAndCommentsForRegion.server'
import { CreateNoteCommentSchema, CreateNoteSchema } from '@/server/notes/schemas'
import { formatUserDisplayName } from '@/shared/userDisplayName'

const id = z.string().regex(/^\d+$/).transform(Number)
const FolderParams = z.object({ regionSlug: z.string().min(1), folderId: id })
const NoteParams = FolderParams.extend({ noteId: id })

type FolderParamsInput = z.input<typeof FolderParams>
type NoteParamsInput = z.input<typeof NoteParams>

const ListQuery = z.object({
  status: z.enum(['open', 'closed']).optional(),
  // minLon,minLat,maxLon,maxLat (the order of the OSM API)
  bbox: z
    .string()
    .transform((value) => value.split(',').map(Number))
    .pipe(z.tuple([z.number(), z.number(), z.number(), z.number()]))
    .optional(),
})

const UpdateNoteBody = z.object({ resolved: z.boolean() })

/**
 * Token → session → region member → folder in region. Answers the cases a client has to tell
 * apart; the notes functions below run their own member and region checks again.
 */
async function guardFolder(request: Request, params: FolderParamsInput) {
  const caller = await requireExternalSession(request, 'notes')
  const { regionSlug, folderId } = FolderParams.parse(params)

  // Internal notes are member/admin-only, also on PUBLIC regions.
  const access = await canAccessMemberModeForRegion(caller.session, regionSlug)
  if (!access.isAuthorized) {
    if (access.regionId == null) {
      throw new ExternalApiError(404, 'region_not_found', 'Region not found')
    }
    throw new ExternalApiError(403, 'not_member', 'Not a member of this region')
  }

  const folder = await db.noteFolder.findFirst({
    where: { id: folderId, regions: { some: { slug: regionSlug } } },
    select: { id: true },
  })
  if (!folder)
    throw new ExternalApiError(404, 'folder_not_found', 'Folder not found in this region')

  return { caller, regionSlug, folderId }
}

async function guardNote(request: Request, params: NoteParamsInput) {
  const guarded = await guardFolder(request, params)
  const { noteId } = NoteParams.parse(params)

  const note = await db.note.findFirst({
    where: { id: noteId, folderId: guarded.folderId },
    select: { id: true },
  })
  if (!note) throw new ExternalApiError(404, 'note_not_found', 'Note not found in this folder')

  return { ...guarded, noteId }
}

async function noteDetail(noteId: number, caller: ExternalNotesCaller) {
  const note = await getNoteAndComments({ id: noteId }, caller)
  if (!note) throw new ExternalApiError(404, 'note_not_found', 'Note not found in this folder')

  const author = (user: (typeof note)['author']) => ({
    id: user.id,
    name: formatUserDisplayName(user) ?? '',
  })
  return {
    id: note.id,
    folderId: note.folderId,
    subject: note.subject,
    body: note.body,
    status: note.resolvedAt ? ('closed' as const) : ('open' as const),
    resolvedAt: note.resolvedAt,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    longitude: note.longitude,
    latitude: note.latitude,
    author: author(note.author),
    isAuthor: note.author.id === caller.session.userId,
    comments: (note.noteComments ?? []).map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: author(comment.author),
      isAuthor: comment.author.id === caller.session.userId,
    })),
  }
}

export async function listExternalNotes(request: Request, params: FolderParamsInput) {
  const { caller, regionSlug, folderId } = await guardFolder(request, params)
  const searchParams = new URL(request.url).searchParams
  const { status, bbox } = ListQuery.parse({
    status: searchParams.get('status') ?? undefined,
    bbox: searchParams.get('bbox') ?? undefined,
  })

  const { featureCollection } = await getNotesAndCommentsForRegion(
    { regionSlug, folderId, filter: status ? { completed: status === 'closed' } : null },
    caller,
  )
  if (!bbox) return featureCollection

  const [minLon, minLat, maxLon, maxLat] = bbox
  return {
    ...featureCollection,
    features: featureCollection.features.filter((feature) => {
      if (feature.geometry.type !== 'Point') return false
      const [lon, lat] = feature.geometry.coordinates
      return (
        lon !== undefined &&
        lat !== undefined &&
        lon >= minLon &&
        lon <= maxLon &&
        lat >= minLat &&
        lat <= maxLat
      )
    }),
  }
}

export async function getExternalNote(request: Request, params: NoteParamsInput) {
  const { caller, noteId } = await guardNote(request, params)
  return noteDetail(noteId, caller)
}

export async function createExternalNote(request: Request, params: FolderParamsInput) {
  const { caller, regionSlug, folderId } = await guardFolder(request, params)
  const body = CreateNoteSchema.parse(await jsonBody(request))

  const note = await createNote({ ...body, regionSlug, folderId }, caller)
  return noteDetail(note.id, caller)
}

export async function createExternalNoteComment(request: Request, params: NoteParamsInput) {
  const { caller, regionSlug, noteId } = await guardNote(request, params)
  const { body } = CreateNoteCommentSchema.pick({ body: true }).parse(await jsonBody(request))

  await createNoteComment({ regionSlug, noteId, body }, caller)
  return noteDetail(noteId, caller)
}

export async function updateExternalNote(request: Request, params: NoteParamsInput) {
  const { caller, regionSlug, noteId } = await guardNote(request, params)
  const { resolved } = UpdateNoteBody.parse(await jsonBody(request))

  await updateNoteResolvedAt({ regionSlug, noteId, resolved }, caller)
  return noteDetail(noteId, caller)
}
