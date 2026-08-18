import { beforeEach, describe, expect, test, vi } from 'vitest'

const { regionContractFindUnique, regionUploadFindFirst, regionFindUnique } = vi.hoisted(() => ({
  regionContractFindUnique: vi.fn(),
  regionUploadFindFirst: vi.fn(),
  regionFindUnique: vi.fn(),
}))

vi.mock('@/server/db.server', () => ({
  default: {
    regionContract: { findUnique: regionContractFindUnique },
    regionUpload: { findFirst: regionUploadFindFirst },
    region: { findUnique: regionFindUnique },
  },
}))

import {
  assertHeaderLogoBelongsToRegion,
  assertRegionCanBeDeleted,
  assertRegionContractExists,
  validateRegionConfigRelations,
} from './regionWriteGuards.server'

beforeEach(() => {
  regionContractFindUnique.mockReset()
  regionUploadFindFirst.mockReset()
  regionFindUnique.mockReset()
})

describe('assertRegionContractExists', () => {
  test('no-ops when contractId is null', async () => {
    await expect(assertRegionContractExists(null)).resolves.toBeUndefined()
    expect(regionContractFindUnique).not.toHaveBeenCalled()
  })

  test('throws when contract does not exist', async () => {
    regionContractFindUnique.mockResolvedValueOnce(null)
    await expect(assertRegionContractExists(99)).rejects.toThrow('Auftrag nicht gefunden')
  })
})

describe('assertHeaderLogoBelongsToRegion', () => {
  test('no-ops when headerLogoId is null', async () => {
    await expect(assertHeaderLogoBelongsToRegion(null, 1)).resolves.toBeUndefined()
    expect(regionUploadFindFirst).not.toHaveBeenCalled()
  })

  test('throws when upload belongs to another region', async () => {
    regionUploadFindFirst.mockResolvedValueOnce(null)
    await expect(assertHeaderLogoBelongsToRegion(42, 1)).rejects.toThrow(
      'Header-Logo (id=42) gehört nicht zu dieser Region',
    )
  })
})

describe('validateRegionConfigRelations', () => {
  test('rejects welcome image on create', async () => {
    await expect(
      validateRegionConfigRelations({
        contractId: null,
        headerLogoId: null,
        welcome: {
          enabled: true,
          title: 'Willkommen',
          image: { uploadId: 1, altText: 'Bild' },
          sections: [],
        },
      }),
    ).rejects.toThrow('Willkommens-Bild kann beim Anlegen nicht gesetzt werden')
  })

  test('rejects welcome image on create even when welcome is disabled', async () => {
    await expect(
      validateRegionConfigRelations({
        contractId: null,
        headerLogoId: null,
        welcome: {
          enabled: false,
          title: '',
          image: { uploadId: 1, altText: 'Bild' },
          sections: [],
        },
      }),
    ).rejects.toThrow('Willkommens-Bild kann beim Anlegen nicht gesetzt werden')
  })

  test('checks welcome image ownership on update even when welcome is disabled', async () => {
    regionUploadFindFirst.mockResolvedValueOnce(null)
    await expect(
      validateRegionConfigRelations(
        {
          contractId: null,
          headerLogoId: null,
          welcome: {
            enabled: false,
            title: '',
            image: { uploadId: 42, altText: 'Bild' },
            sections: [],
          },
        },
        1,
      ),
    ).rejects.toThrow('Das Willkommens-Bild gehört nicht zu dieser Region')
  })
})

describe('assertRegionCanBeDeleted', () => {
  test('throws when region has memberships', async () => {
    regionFindUnique.mockResolvedValueOnce({
      slug: 'berlin',
      _count: { memberships: 2, noteRecords: 0, qaConfigs: 0, mapDatasetUploads: 0 },
    })
    await expect(assertRegionCanBeDeleted('berlin')).rejects.toThrow('2 Mitgliedschaft(en)')
  })

  test('throws when region has mapDatasetUploads', async () => {
    regionFindUnique.mockResolvedValueOnce({
      slug: 'berlin',
      _count: { memberships: 0, noteRecords: 0, qaConfigs: 0, mapDatasetUploads: 1 },
    })
    await expect(assertRegionCanBeDeleted('berlin')).rejects.toThrow('Map-Dataset-Upload')
  })

  test('allows delete when no blockers', async () => {
    regionFindUnique.mockResolvedValueOnce({
      slug: 'test',
      _count: { memberships: 0, noteRecords: 0, qaConfigs: 0, mapDatasetUploads: 0 },
    })
    await expect(assertRegionCanBeDeleted('test')).resolves.toBeUndefined()
  })
})
