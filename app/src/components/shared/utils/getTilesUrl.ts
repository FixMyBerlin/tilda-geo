import { appInstances, currentAppInstance, deployedHostSchema } from './appInstances.const'
import { devTilesPort } from './devTilesPort'
import { envKey } from './isEnv'

const devTilesHost = 'localhost'

export const tilesHostSchema = deployedHostSchema('tiles', devTilesHost)

export const getTilesUrl = (path?: string) => {
  const base =
    envKey === 'development'
      ? `http://${devTilesHost}:${devTilesPort()}`
      : appInstances[currentAppInstance()][envKey].tiles

  return path ? `${base}/${path.replace(/^\//, '')}` : base
}
