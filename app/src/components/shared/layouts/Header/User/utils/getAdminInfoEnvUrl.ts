import { createIsomorphicFn } from '@tanstack/react-start'
import { envKey } from '@/components/shared/utils/isEnv'

const envFrontendDomain = {
  development: 'http://127.0.0.1:5173/',
  staging: 'https://staging.tilda-geo.de/',
  production: 'https://tilda-geo.de/',
}

type Environment = keyof typeof envFrontendDomain

export const getAdminInfoEnvUrl = createIsomorphicFn()
  .server((_targetEnv: Environment) => undefined)
  .client((targetEnv: Environment) => {
    const currentEnvDomain = envFrontendDomain[envKey]
    const targetEnvDomain = envFrontendDomain[targetEnv]
    const currentUrl = window.location.href
    return currentUrl.replace(currentEnvDomain, targetEnvDomain)
  })
