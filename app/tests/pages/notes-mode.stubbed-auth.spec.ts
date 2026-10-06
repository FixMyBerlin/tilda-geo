import { expect, test, type TestInfo } from '@playwright/test'
import db from '../../src/server/db.server'
import { cleanupStubbedSessionData, createStubbedAdminSession } from '../fixtures/auth'
import { expectNoConsoleErrors } from '../utils/console'
import { waitForMapLoad } from '../utils/maps'

// woldegk is an internal-notes (TILDA) PUBLIC region that already has an "Allgemein" folder
// (created by the note_folders migration backfill). A region member/admin manages folders here.
const REGION = 'woldegk'
const NOTES_MODE_URL = `/regionen/${REGION}/hinweise`
const REAL_EMAIL_PREFIX = 'e2e-notes-mode-'
const FOLDER_NAME_PREFIX = 'E2E Ordner'
const NOTE_SUBJECT_PREFIX = 'E2E Hinweis'

const folderHeading = (name: string) => `Ordner »${name}«`

test.describe('Notes mode – note folders (stubbed admin login)', () => {
  test('create, rename, move a note between folders, then delete the empty folder', async ({
    page,
  }, testInfo: TestInfo) => {
    test.setTimeout(60_000)

    const baseURL = testInfo.project.use.baseURL
    if (typeof baseURL !== 'string') throw new Error('Playwright baseURL must be a string')

    const identityKey = 'notes-mode-folder-flow'
    const user = await createStubbedAdminSession(page, baseURL, { identityKey })
    await db.user.update({
      where: { id: user.id },
      data: { email: `${REAL_EMAIL_PREFIX}${user.id}@example.com` },
    })

    const folderName = `${FOLDER_NAME_PREFIX} ${Date.now()}`
    const renamedFolderName = `${folderName} umbenannt`
    const noteSubject = `${NOTE_SUBJECT_PREFIX} ${Date.now()}`

    try {
      await page.goto(NOTES_MODE_URL)
      expect(new URL(page.url()).pathname).toBe(NOTES_MODE_URL)
      // Primed by the route loader, so the first folder ("Allgemein") is selected immediately.
      await expect(page.getByRole('heading', { name: folderHeading('Allgemein') })).toBeVisible({
        timeout: 30_000,
      })
      await waitForMapLoad(page)

      // Open the collection disclosure (clicking the heading toggles it) and create a new folder.
      await page.getByRole('heading', { name: folderHeading('Allgemein') }).click()
      await page.getByRole('button', { name: 'Neuer Ordner…' }).click()
      await page.getByLabel('Name').fill(folderName)
      await page.getByRole('button', { name: 'Anlegen' }).click()
      await expect(page.getByRole('heading', { name: folderHeading(folderName) })).toBeVisible({
        timeout: 10_000,
      })

      // Rename it via the header "Ordner verwalten" menu.
      await page.getByRole('button', { name: 'Ordner verwalten' }).click()
      await page.getByRole('button', { name: 'Umbenennen' }).click()
      await page.getByLabel('Name').fill(renamedFolderName)
      await page.getByRole('button', { name: 'Speichern' }).click()
      await expect(
        page.getByRole('heading', { name: folderHeading(renamedFolderName) }),
      ).toBeVisible({ timeout: 10_000 })

      // Create a note inside the renamed folder.
      await page.getByRole('button', { name: 'Neuer Hinweis' }).click()
      await expect(page.getByRole('heading', { name: 'Neuer interner Hinweis' })).toBeVisible()
      await page.getByPlaceholder('Betreff').fill(noteSubject)
      await page.getByPlaceholder('Hinweis').fill('E2E-Testinhalt für den Ordner-Workflow.')
      await page.getByRole('button', { name: 'Speichern' }).click()
      await expect(page.getByText(noteSubject).first()).toBeVisible({ timeout: 10_000 })

      // Open the note detail and move it to "Allgemein" via the folder select.
      await page.getByText(noteSubject).first().click()
      await expect(page.getByRole('heading', { name: noteSubject })).toBeVisible({
        timeout: 10_000,
      })
      await page.getByRole('button', { name: 'Hinweis verschieben' }).click()
      await page.getByRole('menuitem', { name: 'In Ordner »Allgemein«' }).click()

      // Back to the list — the active folder switched to "Allgemein" along with the move.
      await page.getByRole('button', { name: 'Zurück zur Liste' }).click()
      await expect(page.getByRole('heading', { name: folderHeading('Allgemein') })).toBeVisible({
        timeout: 10_000,
      })

      // Switch back to the now-empty E2E folder and delete it.
      await page.getByRole('heading', { name: folderHeading('Allgemein') }).click()
      await page.getByRole('option', { name: renamedFolderName }).click()
      await expect(
        page.getByRole('heading', { name: folderHeading(renamedFolderName) }),
      ).toBeVisible({ timeout: 10_000 })

      await page.getByRole('button', { name: 'Ordner verwalten' }).click()
      const deleteButton = page.getByRole('button', { name: 'Löschen' })
      await expect(deleteButton).toBeEnabled()
      await deleteButton.click()

      // Deleting the selected folder falls back to the first folder ("Allgemein").
      await expect(page.getByRole('heading', { name: folderHeading('Allgemein') })).toBeVisible({
        timeout: 10_000,
      })
      await expect(page.getByRole('option', { name: renamedFolderName })).toHaveCount(0)

      await expectNoConsoleErrors(page)
    } finally {
      // Cleanup order matters: notes must go before folders (Note.folder is onDelete: Restrict).
      await db.note.deleteMany({ where: { subject: { startsWith: NOTE_SUBJECT_PREFIX } } })
      await db.noteFolder.deleteMany({ where: { name: { startsWith: FOLDER_NAME_PREFIX } } })
      await cleanupStubbedSessionData('ADMIN', identityKey)
      await db.user.deleteMany({ where: { id: user.id } })
    }
  })
})
