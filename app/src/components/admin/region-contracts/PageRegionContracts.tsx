import { getRouteApi } from '@tanstack/react-router'
import { AdminEditActionLink } from '@/components/admin/adminPageTitle'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { adminHeaderActionButtonClassName, HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { Link } from '@/components/shared/links/Link'
import { Pill } from '@/components/shared/text/Pill'
import { RegionContractStatus } from '@/prisma/generated/browser'

const routeApi = getRouteApi('/admin/region-contracts/')

export function PageRegionContracts() {
  const { contracts } = routeApi.useLoaderData()

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb pages={[{ href: '/admin/region-contracts', name: 'Regionen-Aufträge' }]} />
        <Link to="/admin/region-contracts/new" button className={adminHeaderActionButtonClassName}>
          Neuer Auftrag
        </Link>
      </HeaderWrapper>

      <AdminTable header={['Name', 'Slug', 'Status', 'Regionen', { id: 'edit', label: '' }]}>
        {contracts.map((contract) => (
          <tr key={contract.slug}>
            <th scope="row" className={adminTableClasses.thRow}>
              {contract.name}
            </th>
            <td className={adminTableClasses.td}>{contract.slug}</td>
            <td className={adminTableClasses.td}>
              <Pill color={contract.status === RegionContractStatus.ACTIVE ? 'green' : 'gray'}>
                {contract.status === RegionContractStatus.ACTIVE ? 'Aktiv' : 'Inaktiv'}
              </Pill>
            </td>
            <td className={adminTableClasses.td}>{contract.regionCount}</td>
            <td className={adminTableClasses.td}>
              <AdminEditActionLink
                to="/admin/region-contracts/$slug/edit"
                params={{ slug: contract.slug }}
              />
            </td>
          </tr>
        ))}
      </AdminTable>
    </>
  )
}
