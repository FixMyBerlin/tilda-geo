import { appInstances, currentAppInstance, deployedHostSchema } from './appInstances.const'
import { getTilesUrl } from './getTilesUrl'
import { envKey } from './isEnv'

/** Local dev has no cache in front of Martin, so the cacheless host is the tiles host. */
export const cachelessHostSchema = deployedHostSchema('cacheless', 'localhost')

export const getCachelessTilesUrl = ({ url, cacheless }: { url: string; cacheless: boolean }) => {
  if (!cacheless || envKey === 'development') return url

  const tilesBase = getTilesUrl()
  if (!url.startsWith(tilesBase)) return url
  return `${appInstances[currentAppInstance()][envKey].cacheless}${url.slice(tilesBase.length)}`
}
