const svgSrcPromises = new Map<string, Promise<string | undefined>>()

let loadersPromise:
  | Promise<typeof import('@osm-traffic-signs/converter/data-svgs/DE/loaders')>
  | undefined

function getLoaders() {
  loadersPromise ??= import('@osm-traffic-signs/converter/data-svgs/DE/loaders')
  return loadersPromise
}

export async function loadBundledTrafficSignSvg(svgName: string | null) {
  if (!svgName) return undefined

  const { SvgLoadersDE } = await getLoaders()
  const loader = SvgLoadersDE[svgName as keyof typeof SvgLoadersDE]
  if (!loader) return undefined

  const module = await loader()
  return module.default
}

export function getTrafficSignSvgPromise(svgName: string) {
  const cached = svgSrcPromises.get(svgName)
  if (cached) return cached

  const promise = loadBundledTrafficSignSvg(svgName)
  svgSrcPromises.set(svgName, promise)
  return promise
}
