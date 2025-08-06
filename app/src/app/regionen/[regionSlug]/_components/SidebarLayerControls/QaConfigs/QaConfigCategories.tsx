import getQaConfigsForRegion from '@/src/server/qa-configs/queries/getQaConfigsForRegion'
import { useQuery } from '@blitzjs/rpc'
import { useRegionSlug } from '../../regionUtils/useRegionSlug'
import { QaConfigCategory } from './QaConfigCategory'

export const QaConfigCategories = () => {
  const regionSlug = useRegionSlug()
  const [qaConfigs] = useQuery(getQaConfigsForRegion, { regionSlug: regionSlug! })

  if (!qaConfigs?.length) return null

  return (
    <nav className="relative z-0 flex flex-col bg-amber-50">
      {qaConfigs.map((qaConfig) => (
        <QaConfigCategory key={qaConfig.id} qaConfig={qaConfig} />
      ))}
    </nav>
  )
}
