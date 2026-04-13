import { createIsomorphicFn } from '@tanstack/react-start'
import { getAppBaseUrl } from '@/components/shared/utils/getAppBaseUrl'
import { envKey } from '@/components/shared/utils/isEnv'

type Environment = NonNullable<Parameters<typeof getAppBaseUrl>[1]>

export const getAdminInfoEnvUrl = createIsomorphicFn()
  .server((_targetEnv: Environment) => undefined)
  .client((targetEnv: Environment) => {
    const currentEnvDomain = getAppBaseUrl(undefined, envKey)
    const targetEnvDomain = getAppBaseUrl(undefined, targetEnv)
    const currentUrl = window.location.href
    return currentUrl.replace(currentEnvDomain, targetEnvDomain)
  })
