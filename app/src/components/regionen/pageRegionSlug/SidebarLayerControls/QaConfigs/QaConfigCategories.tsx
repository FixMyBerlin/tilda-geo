import { useQuery } from '@tanstack/react-query'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { regionQaConfigsQueryOptions } from '@/server/regions/regionQueryOptions'
import { QaConfigCategory } from './QaConfigCategory'

export const QaConfigCategories = () => {
  const hasPermissions = useHasPermissions()
  const regionSlug = useRegionSlug()
  const { data: qaConfigs } = useQuery({
    ...regionQaConfigsQueryOptions(regionSlug ?? ''),
    enabled: hasPermissions && Boolean(regionSlug),
  })

  if (!hasPermissions) return null
  if (!qaConfigs?.length) return null

  return (
    <nav className="relative z-0 flex flex-col bg-amber-50">
      {qaConfigs.map((qaConfig) => (
        <QaConfigCategory key={qaConfig.id} qaConfig={qaConfig} />
      ))}
    </nav>
  )
}
