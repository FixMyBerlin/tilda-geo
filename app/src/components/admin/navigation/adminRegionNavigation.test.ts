import { describe, expect, test } from 'vitest'
import { buildAdminRegionNavigation } from './adminRegionNavigation'

describe('buildAdminRegionNavigation', () => {
  test('scopes every link to the region', () => {
    const links = buildAdminRegionNavigation({ slug: 'bb', contract: null })

    expect(links.map((link) => link.key)).toEqual([
      'edit',
      'members',
      'newMembership',
      'uploads',
      'qaConfigs',
      'reviewLists',
      'auditLog',
      'uploadsCsv',
    ])
    expect(links.find((link) => link.key === 'edit')).toMatchObject({
      to: '/admin/regions/$regionSlug/edit',
      params: { regionSlug: 'bb' },
    })
    // The lists open filtered to the region.
    for (const [key, to] of [
      ['members', '/admin/memberships'],
      ['newMembership', '/admin/memberships/new'],
      ['uploads', '/admin/map-dataset-uploads'],
      ['qaConfigs', '/admin/qa-configs'],
      ['reviewLists', '/admin/review-lists'],
      ['auditLog', '/admin/audit-log'],
    ] as const) {
      expect(links.find((link) => link.key === key)).toMatchObject({
        to,
        search: { regionSlug: 'bb' },
      })
    }
    expect(links.filter((link) => link.external).map((link) => link.key)).toEqual(['uploadsCsv'])
  })

  test('adds the contract link only when the region has a contract', () => {
    const links = buildAdminRegionNavigation({ slug: 'bb', contract: { slug: 'c-1' } })

    expect(links.find((link) => link.key === 'contract')).toMatchObject({
      to: '/admin/region-contracts/$slug/edit',
      params: { slug: 'c-1' },
    })
  })
})
