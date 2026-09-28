import { createIsomorphicFn } from '@tanstack/react-start'
import { getAppBaseUrl } from '@/components/shared/utils/getAppBaseUrl'

type Environment = NonNullable<Parameters<typeof getAppBaseUrl>[1]>

export const getAdminInfoEnvUrl = createIsomorphicFn()
  .server((_targetEnv: Environment) => undefined)
  .client((targetEnv: Environment) => {
    const currentEnvDomain = getAppBaseUrl()
    const targetEnvDomain = getAppBaseUrl(undefined, targetEnv)
    const currentUrl = window.location.href
    return currentUrl.replace(currentEnvDomain, targetEnvDomain)
  })
