import { beforeEach, describe, expect, test, vi } from 'vitest'
import { AuthorizationError } from '@/server/auth/errors'

const { qaConfigWrite, requireAdmin } = vi.hoisted(() => ({
  qaConfigWrite: vi.fn(),
  requireAdmin: vi.fn(),
}))

vi.mock('@/server/db.server', () => ({
  default: { qaConfig: { create: qaConfigWrite, update: qaConfigWrite, delete: qaConfigWrite } },
}))
vi.mock('@/server/auth/session.server', () => ({ requireAdmin }))

import { createQaConfigWithData } from './createQaConfig.server'
import { deleteQaConfig } from './deleteQaConfig.server'
import { updateQaConfigWithData } from './updateQaConfig.server'

const headers = new Headers()

beforeEach(() => {
  qaConfigWrite.mockReset()
  requireAdmin.mockRejectedValue(new AuthorizationError('Admin access required'))
})

// QA configuration is admin-only; region members only evaluate areas.
describe('QA config mutations reject non-admins', () => {
  test('create and update return an error state without writing', async () => {
    // Form mutations catch errors into a FormState instead of throwing.
    const data = {} as Parameters<typeof createQaConfigWithData>[0]
    await expect(createQaConfigWithData(data, headers)).resolves.toMatchObject({ success: false })
    await expect(
      updateQaConfigWithData({ id: 1 } as Parameters<typeof updateQaConfigWithData>[0], headers),
    ).resolves.toMatchObject({ success: false })
    expect(qaConfigWrite).not.toHaveBeenCalled()
  })

  test('delete throws without writing', async () => {
    await expect(deleteQaConfig({ id: 1 }, headers)).rejects.toThrow(AuthorizationError)
    expect(qaConfigWrite).not.toHaveBeenCalled()
  })
})
