import { Link } from '@/src/app/_components/links/Link'
import { invoke } from '@/src/blitz-server'
import getQaConfigs from '@/src/server/qa-configs/queries/getQaConfigs'
import { Metadata } from 'next'
import { Breadcrumb } from '../_components/Breadcrumb'
import { HeaderWrapper } from '../_components/HeaderWrapper'
import { QaConfigCard } from './_components/QaConfigCard'

export const metadata: Metadata = {
  title: 'QA Konfigurationen',
}

export default async function AdminQaConfigsPage() {
  const qaConfigs = await invoke(getQaConfigs, {})

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb pages={[{ href: '/admin/qa-configs', name: 'QA Konfigurationen' }]} />
        <Link href="/admin/qa-configs/new" button>
          Neue QA Konfiguration
        </Link>
      </HeaderWrapper>

      <div className="space-y-4">
        {qaConfigs.map((config) => (
          <QaConfigCard key={config.id} config={config} />
        ))}
      </div>
    </>
  )
}
