const BG3D_MODULES = ['buildings', 'terrain'] as const

export type Bg3dModule = (typeof BG3D_MODULES)[number]

const BG3D_MODULE_SET = new Set<string>(BG3D_MODULES)

export const parseBg3dParam = (query: string | undefined | null): Bg3dModule[] => {
  if (!query) return []
  const seen = new Set<Bg3dModule>()
  const modules: Bg3dModule[] = []

  for (const part of query.split(',')) {
    const trimmed = part.trim()
    if (!BG3D_MODULE_SET.has(trimmed)) continue
    const module = trimmed as Bg3dModule
    if (seen.has(module)) continue
    seen.add(module)
    modules.push(module)
  }

  return modules.sort((a, b) => BG3D_MODULES.indexOf(a) - BG3D_MODULES.indexOf(b))
}

export const serializeBg3dParam = (modules: Bg3dModule[]): string | undefined => {
  const canonical = parseBg3dParam(modules.join(','))
  if (canonical.length === 0) return undefined
  return canonical.join(',')
}

export const is3dBuildingActive = (modules: Bg3dModule[]) => modules.includes('buildings')

export const is3dTerrainActive = (modules: Bg3dModule[]) => modules.includes('terrain')

export const is3dActive = (modules: Bg3dModule[]) => modules.length > 0
