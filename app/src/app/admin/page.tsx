import { Link } from '@/src/app/_components/links/Link'
import { Metadata } from 'next'
import { Breadcrumb } from './_components/Breadcrumb'
import { HeaderWrapper } from './_components/HeaderWrapper'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function AdminDashboardPage() {
  return (
    <>
      <HeaderWrapper>
        <Breadcrumb pages={[{ href: '/admin', name: 'Dashboard' }]} />
      </HeaderWrapper>

      <ul>
        <li>
          <Link href="/admin/regions">Regionen</Link>
        </li>
        <li>
          <Link href="/admin/qa-configs">QA Konfigurationen</Link>
        </li>
        <li>
          <Link href="/admin/memberships">Nutzer:innen & Mitgliedschaften</Link>
        </li>
        <li>
          <Link href="/admin/uploads">Uploads</Link>
        </li>
      </ul>
    </>
  )
}
