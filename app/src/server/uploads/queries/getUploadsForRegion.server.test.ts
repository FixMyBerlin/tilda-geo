import { beforeEach, describe, expect, test, vi } from 'vitest'
import { RegionStatus, UserRoleEnum } from '@/prisma/generated/enums'

const { getAppSession, uploadFindMany, membershipFindMany } = vi.hoisted(() => ({
  getAppSession: vi.fn(),
  uploadFindMany: vi.fn(),
  membershipFindMany: vi.fn(),
}))

vi.mock('@/server/auth/session.server', () => ({ getAppSession }))
vi.mock('@/server/db.server', () => ({
  default: {
    mapDatasetUpload: { findMany: uploadFindMany },
    membership: { findMany: membershipFindMany },
  },
}))
vi.mock('@/server/map-dataset-categories/queries/loadMapDatasetCategoryMap.server', () => ({
  loadMapDatasetCategoryMap: vi.fn().mockResolvedValue(new Map()),
  categoryPresentationForConfigCategory: () => ({
    categorySortOrder: 0,
    categoryTitle: '',
    categorySubtitle: null,
  }),
}))

import { getUploadsForRegionUser } from './getUploadsForRegion.server'

const regionA = { id: 1, status: RegionStatus.DEACTIVATED }
const regionB = { id: 2, status: RegionStatus.PRIVATE }

const config = {
  id: 'layer',
  name: 'Layer',
  categoryKey: 'cat',
  attributionHtml: '',
}
const uploadRow = (slug: string, regions: { id: number }[], isPublic = false) => ({
  slug,
  public: isPublic,
  hideDownloadLink: false,
  mapRenderFormat: 'geojson',
  mapRenderUrl: '',
  githubUrl: '',
  geojsonUrl: 'https://bucket.s3.example/x.geojson',
  pmtilesUrl: null,
  systemLayer: false,
  configs: [config],
  styleGroups: [],
  attributionHtml: '',
  regions: regions.map(({ id }) => ({ id, slug: `region-${id}` })),
})

// The database answers like Prisma for the filter the code sends: userId and the region status.
function memberships(rows: { userId: string; region: { id: number; status: string } }[]) {
  membershipFindMany.mockImplementation(
    async ({ where }: { where: { userId: string; region?: { status: { not: string } } } }) =>
      rows
        .filter(
          (row) =>
            row.userId === where.userId &&
            (!where.region || row.region.status !== where.region.status.not),
        )
        .map((row) => ({ regionId: row.region.id })),
  )
}

const slugsFor = async () =>
  (await getUploadsForRegionUser({ regionSlug: 'region-2' }, new Headers())).map(
    (dataset) => dataset.id,
  )

beforeEach(() => {
  getAppSession.mockReset()
  uploadFindMany.mockReset()
  membershipFindMany.mockReset()
  getAppSession.mockResolvedValue({ userId: 'user-1', role: UserRoleEnum.USER })
  uploadFindMany.mockResolvedValue([
    uploadRow('in-a-and-b', [regionA, regionB]),
    uploadRow('only-a', [regionA]),
    uploadRow('only-b', [regionB]),
    uploadRow('public-one', [regionB], true),
  ])
})

describe('uploads listed for a region (member rule)', () => {
  test('a membership of a DEACTIVATED region does not list its private uploads', async () => {
    memberships([{ userId: 'user-1', region: regionA }])

    expect(await slugsFor()).toEqual(['public-one'])
  })

  test('a membership of a region that is not deactivated lists the private uploads of it', async () => {
    memberships([
      { userId: 'user-1', region: regionA },
      { userId: 'user-1', region: regionB },
    ])

    expect(await slugsFor()).toEqual(['in-a-and-b', 'only-b', 'public-one'])
  })

  test('memberships of other users do not count', async () => {
    memberships([{ userId: 'user-2', region: regionB }])

    expect(await slugsFor()).toEqual(['public-one'])
  })

  test('guests see public uploads only, admins see all', async () => {
    getAppSession.mockResolvedValue(null)
    expect(await slugsFor()).toEqual(['public-one'])

    getAppSession.mockResolvedValue({ userId: 'admin-1', role: UserRoleEnum.ADMIN })
    expect(await slugsFor()).toEqual(['in-a-and-b', 'only-a', 'only-b', 'public-one'])
  })
})
