import { existsSync, readFileSync } from 'node:fs'

const base64Digits = new Map(
  [...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'].map((char, index) => [
    char,
    index,
  ]),
)

const decodeVlqSegment = (segment: string) => {
  const values: number[] = []
  let value = 0
  let shift = 0
  for (const char of segment) {
    const digit = base64Digits.get(char) ?? 0
    value += (digit & 31) << shift
    if (digit & 32) {
      shift += 5
    } else {
      values.push(value & 1 ? -(value >> 1) : value >> 1)
      value = 0
      shift = 0
    }
  }
  return values
}

/** Groups a source path by npm package or by `src/` folder, two levels deep. */
const sourceGroup = (source: string) => {
  const nodeModulesPath = source.split('node_modules/').at(-1)
  if (nodeModulesPath !== source && nodeModulesPath) {
    const [scopeOrName, name] = nodeModulesPath.split('/')
    return scopeOrName?.startsWith('@') ? `${scopeOrName}/${name}` : (scopeOrName ?? source)
  }
  const srcPath = source.split('/src/').at(-1) ?? source
  return `src/${srcPath.split('/').slice(0, 3).join('/')}`
}

/**
 * Adds the minified bytes of a built chunk to the source group they came from, using the chunk's
 * sourcemap (`<chunk>.map` next to it).
 */
export const addChunkSourceBytes = (chunkPath: string, bytesByGroup: Map<string, number>) => {
  const code = readFileSync(chunkPath, 'utf8')
  if (!existsSync(`${chunkPath}.map`)) {
    bytesByGroup.set('no sourcemap', (bytesByGroup.get('no sourcemap') ?? 0) + code.length)
    return
  }
  const lines = code.split('\n')
  const map = JSON.parse(readFileSync(`${chunkPath}.map`, 'utf8')) as {
    sources: string[]
    mappings: string
  }
  let sourceIndex = 0
  map.mappings.split(';').forEach((lineMappings, lineIndex) => {
    const lineLength = lines[lineIndex]?.length ?? 0
    const segments: Array<{ column: number; source: number | null }> = []
    let column = 0
    for (const segment of lineMappings.split(',')) {
      if (!segment) continue
      const [columnDelta = 0, sourceDelta] = decodeVlqSegment(segment)
      column += columnDelta
      if (sourceDelta === undefined) {
        segments.push({ column, source: null })
      } else {
        sourceIndex += sourceDelta
        segments.push({ column, source: sourceIndex })
      }
    }
    segments.forEach(({ column: start, source }, index) => {
      const end = segments[index + 1]?.column ?? lineLength
      const group = source === null ? 'unmapped' : sourceGroup(map.sources[source] ?? 'unknown')
      bytesByGroup.set(group, (bytesByGroup.get(group) ?? 0) + end - start)
    })
  })
}
