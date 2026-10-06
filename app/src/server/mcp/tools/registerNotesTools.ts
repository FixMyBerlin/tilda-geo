import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { AdminApiCaller } from '@/server/auth/memberCaller.server'
import { run } from '@/server/mcp/mcpToolResult'
import { createNote } from '@/server/notes/mutations/createNote.server'
import { createNoteComment } from '@/server/notes/mutations/createNoteComment.server'
import { createNoteFolder } from '@/server/notes/mutations/createNoteFolder.server'
import { deleteNote } from '@/server/notes/mutations/deleteNote.server'
import { deleteNoteComment } from '@/server/notes/mutations/deleteNoteComment.server'
import { deleteNoteFolder } from '@/server/notes/mutations/deleteNoteFolder.server'
import { moveNoteToFolder } from '@/server/notes/mutations/moveNoteToFolder.server'
import { updateNote } from '@/server/notes/mutations/updateNote.server'
import { updateNoteComment } from '@/server/notes/mutations/updateNoteComment.server'
import { updateNoteFolderForAdmin } from '@/server/notes/mutations/updateNoteFolderForAdmin.server'
import { updateNoteResolvedAt } from '@/server/notes/mutations/updateNoteResolvedAt.server'
import { assertNoteInRegion } from '@/server/notes/queries/assertFolderInRegion.server'
import { getNoteAndComments } from '@/server/notes/queries/getNoteAndComments.server'
import { getNoteFoldersForRegion } from '@/server/notes/queries/getNoteFoldersForRegion.server'
import { getNotesAndCommentsForRegion } from '@/server/notes/queries/getNotesAndCommentsForRegion.server'
import { CreateNoteSchema } from '@/server/notes/schemas'
import { idInput, regionSlugInput } from './mcpToolInputs'
import { registerCollectionTools } from './registerCollectionTools'

const authorOnly = 'Only the author (here: the API token owner) may do this.'

/** Internal TILDA notes ("Hinweise") and their folders — the same functions the region UI calls. */
export function registerNotesTools(server: McpServer, caller: AdminApiCaller) {
  registerCollectionTools(server, {
    prefix: 'note_folders',
    noun: 'note folder',
    contents: 'notes',
    list: async (input) => (await getNoteFoldersForRegion(input, caller)).folders,
    create: (input) => createNoteFolder(input, caller),
    update: ({ id, ...config }) => updateNoteFolderForAdmin(id, config, caller),
    remove: ({ id, ...input }) => deleteNoteFolder({ ...input, folderId: id }, caller),
  })

  server.registerTool(
    'notes_list',
    {
      description:
        'List the notes of one folder as a GeoJSON FeatureCollection of points (properties: id, ' +
        'status open|closed, subject, authorName, commentCount, latestComment), plus authors and ' +
        'stats. Optional status and query (subject, body and comments) filters. ' +
        'Use notes_get for the body and all comments.',
      inputSchema: {
        regionSlug: regionSlugInput,
        folderId: idInput,
        status: z.enum(['open', 'closed']).optional(),
        query: z.string().min(1).optional(),
      },
    },
    ({ regionSlug, folderId, status, query }) =>
      run(() =>
        getNotesAndCommentsForRegion(
          {
            regionSlug,
            folderId,
            filter: { completed: status ? status === 'closed' : null, query },
          },
          caller,
        ),
      ),
  )

  server.registerTool(
    'notes_get',
    {
      description: 'Get one note with its body, position, author and all comments.',
      inputSchema: { regionSlug: regionSlugInput, noteId: idInput },
    },
    ({ regionSlug, noteId }) =>
      run(async () => {
        await assertNoteInRegion(noteId, regionSlug)
        const note = await getNoteAndComments({ id: noteId }, caller)
        if (!note) throw new Error(`Note not found: ${noteId}`)
        return note
      }),
  )

  server.registerTool(
    'notes_create',
    {
      description:
        'Create a note in a folder at latitude/longitude (WGS84). The author is the API token ' +
        'owner. body is Markdown.',
      inputSchema: {
        regionSlug: regionSlugInput,
        folderId: idInput,
        ...CreateNoteSchema.shape,
      },
    },
    (args) => run(() => createNote(args, caller)),
  )

  server.registerTool(
    'notes_update',
    {
      description:
        `Edit a note. Full replace of subject, body and resolved. ${authorOnly} ` +
        'To only resolve or reopen a note use notes_set_resolved.',
      inputSchema: {
        regionSlug: regionSlugInput,
        noteId: idInput,
        subject: z.string(),
        body: z.string(),
        resolved: z.boolean(),
      },
    },
    (args) => run(() => updateNote(args, caller)),
  )

  server.registerTool(
    'notes_set_resolved',
    {
      description: 'Resolve (true) or reopen (false) a note. Works for notes of any author.',
      inputSchema: { regionSlug: regionSlugInput, noteId: idInput, resolved: z.boolean() },
    },
    (args) => run(() => updateNoteResolvedAt(args, caller)),
  )

  server.registerTool(
    'notes_move',
    {
      description: 'Move a note to another folder of the same region.',
      inputSchema: { regionSlug: regionSlugInput, noteId: idInput, folderId: idInput },
    },
    (args) => run(() => moveNoteToFolder(args, caller)),
  )

  server.registerTool(
    'notes_delete',
    {
      description: `Delete a note including its comments. ${authorOnly}`,
      inputSchema: { regionSlug: regionSlugInput, noteId: idInput },
    },
    (args) => run(() => deleteNote(args, caller)),
  )

  server.registerTool(
    'note_comments_create',
    {
      description: 'Add a comment (Markdown) to a note. The author is the API token owner.',
      inputSchema: { regionSlug: regionSlugInput, noteId: idInput, body: z.string().min(1) },
    },
    (args) => run(() => createNoteComment(args, caller)),
  )

  server.registerTool(
    'note_comments_update',
    {
      description: `Edit a note comment. ${authorOnly}`,
      inputSchema: { regionSlug: regionSlugInput, commentId: idInput, body: z.string().min(1) },
    },
    (args) => run(() => updateNoteComment(args, caller)),
  )

  server.registerTool(
    'note_comments_delete',
    {
      description: `Delete a note comment. ${authorOnly}`,
      inputSchema: { regionSlug: regionSlugInput, commentId: idInput },
    },
    (args) => run(() => deleteNoteComment(args, caller)),
  )
}
