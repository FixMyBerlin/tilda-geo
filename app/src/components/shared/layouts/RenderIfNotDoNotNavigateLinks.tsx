import { useHydrated } from '@tanstack/react-router'
import { Link } from '../links/Link'
import { getAdminInfoEnvUrl } from './Header/User/utils/getAdminInfoEnvUrl'

export const RenderIfNotDoNotNavigateLinks = () => {
  const hydrated = useHydrated()
  const stagingUrl = hydrated ? getAdminInfoEnvUrl('staging') : undefined
  const prodUrl = hydrated ? getAdminInfoEnvUrl('production') : undefined

  return (
    <div className="space-x-4 text-white">
      {stagingUrl && (
        <Link blank href={stagingUrl}>
          Open Staging
        </Link>
      )}
      {prodUrl && (
        <Link blank href={prodUrl}>
          Open Production
        </Link>
      )}
    </div>
  )
}
