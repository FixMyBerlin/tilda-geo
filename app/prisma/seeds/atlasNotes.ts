import db from '../../src/server/db.server'

type RegionNotesSeed = {
  slug: string
  /** OSM notes come from the OSM API at this map center when `notesOsm` is on. */
  map: { lat: number; lng: number }
  folders: string[]
}

/**
 * One region per notes-mode combo (flags live on the region in `regionSeedCatalog`):
 * - only OSM — `dev-status-private` (`notesOsm`, no folders)
 * - only TILDA, 1 folder — `dev-status-public`
 * - nothing — `dev-downloads-disabled` (both flags off, no folders)
 * - OSM + TILDA, 3 folders — `dev-status-promoted`
 */
const regionNotesSeeds = [
  { slug: 'dev-status-private', map: { lat: 52.5, lng: 13.4 }, folders: [] },
  { slug: 'dev-status-public', map: { lat: 52.5, lng: 13.4 }, folders: ['Allgemein'] },
  { slug: 'dev-downloads-disabled', map: { lat: 52.5, lng: 13.4 }, folders: [] },
  {
    slug: 'dev-status-promoted',
    map: { lat: 52.5, lng: 13.4 },
    folders: ['Allgemein', 'Planung', 'Begehung'],
  },
] satisfies RegionNotesSeed[]

const seedInternalNotes = async () => {
  const users = await db.user.findMany({
    take: 2,
    orderBy: { createdAt: 'asc' },
  })

  if (users.length < 2) {
    console.log('⚠️ Skipping atlas notes seed - need at least 2 users')
    return
  }

  const [user1, user2] = users

  if (!user1 || !user2) {
    console.log('⚠️ Skipping atlas notes seed - need at least 2 users')
    return
  }

  const openNoteBody = `
An dieser Stelle ist nicht X sondern Y zu finden.

**Fettdruck**

* Liste
* Liste
      `

  for (const regionSeed of regionNotesSeeds) {
    const region = await db.region.findFirstOrThrow({ where: { slug: regionSeed.slug } })

    for (const [folderIndex, folderName] of regionSeed.folders.entries()) {
      const folder = await db.noteFolder.create({
        data: { name: folderName, regions: { connect: { id: region.id } } },
      })

      const lat = regionSeed.map.lat + folderIndex * 0.08
      const lng = regionSeed.map.lng + folderIndex * 0.08

      const openNote = await db.note.create({
        data: {
          userId: user2.id,
          folderId: folder.id,
          subject: `${folderName}: X nicht Y`,
          body: openNoteBody,
          latitude: lat,
          longitude: lng,
        },
      })

      await db.noteComment.create({
        data: {
          userId: user1.id,
          noteId: openNote.id,
          body: 'Ich stimme zu. **Fettdruck**.',
        },
      })
      await db.noteComment.create({
        data: {
          userId: user2.id,
          noteId: openNote.id,
          updatedAt: new Date(),
          body: 'Ich habe das erledigt.',
        },
      })

      await db.note.create({
        data: {
          userId: user1.id,
          folderId: folder.id,
          subject: `${folderName}: Prüfen ob Z richtig ist`,
          body: `Dieser Hinweis ist bereits erledigt worden und außerdem bearbeitet.`,
          resolvedAt: new Date(),
          updatedAt: new Date(),
          latitude: lat + 0.02,
          longitude: lng + 0.02,
        },
      })
    }
  }
}

export default seedInternalNotes
