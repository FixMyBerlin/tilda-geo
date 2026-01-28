// We use bun.sh to run this file
import { MapDataBackgroundSource } from '@/src/app/regionen/[regionSlug]/_mapData/types'
import { styleText } from 'node:util'
import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { convertTileUrl } from './convertTileUrl'
import { log, warn } from './util'

console.log(styleText(['inverse', 'bold'], 'START'), __filename)

const ELI_BASE_URL = 'https://raw.githubusercontent.com/osmlab/editor-layer-index/gh-pages'
const ELI_DE_DIR = 'sources/europe/de'
const GITHUB_API_URL =
  'https://api.github.com/repos/osmlab/editor-layer-index/contents/sources/europe/de?ref=gh-pages'

const rawDir = path.join(import.meta.dir, 'raw')
const outputFile = path.join(
  import.meta.dir,
  '../../src/app/regionen/[regionSlug]/_mapData/mapDataSources/sourcesBackgroundRasterELI.const.ts',
)

const ELIFeatureSchema = z
  .object({
    type: z.literal('Feature'),
    properties: z
      .object({
        id: z.string(),
        name: z.string(),
        type: z.string(),
        category: z.string().optional(),
        url: z.string(),
        attribution: z
          .object({
            text: z.string(),
            required: z.boolean().optional(),
          })
          .optional(),
        min_zoom: z.number().optional(),
        max_zoom: z.number().optional(),
        tile_size: z.number().optional(),
      })
      .strip(), // Remove any properties we don't need
  })
  .strip() // Remove geometry and any other top-level fields we don't need

type ELIFeature = z.infer<typeof ELIFeatureSchema>

async function fetchFileList() {
  log('Fetching file list from GitHub')
  const response = await fetch(GITHUB_API_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch file list: ${response.statusText}`)
  }
  const files = await response.json()
  return files.filter((file: any) => file.name.endsWith('.geojson'))
}

async function downloadFile(filename: string) {
  const url = `${ELI_BASE_URL}/${ELI_DE_DIR}/${filename}`
  const filePath = path.join(rawDir, filename)

  log(`Downloading ${filename}`)
  const response = await fetch(url)
  if (!response.ok) {
    warn(`Failed to download ${filename}: ${response.statusText}`)
    return false
  }

  const content = await response.text()
  await Bun.write(filePath, content)
  return true
}

function sanitizeId(filename: string): string {
  // Remove .geojson extension
  let id = filename.replace(/\.geojson$/i, '')
  // Convert to lowercase
  id = id.toLowerCase()
  // Replace spaces and special chars with hyphens
  id = id.replace(/[^a-z0-9]+/g, '-')
  // Remove leading/trailing hyphens
  id = id.replace(/^-+|-+$/g, '')
  return `ELI_${id}`
}

async function parseELIFile(filePath: string): Promise<ELIFeature | null> {
  try {
    const file = Bun.file(filePath)
    const json = await file.json()
    const result = ELIFeatureSchema.safeParse(json)

    if (!result.success) {
      warn(
        `Invalid ELI data in ${path.basename(filePath)}: ${result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      )
      return null
    }

    return result.data
  } catch (error) {
    warn(`Failed to parse ${path.basename(filePath)}: ${error}`)
    return null
  }
}

function convertELIToMapDataBackgroundSource(feature: ELIFeature, fileId: string) {
  const props = feature.properties

  // Check if it's a raster type (TMS or WMS)
  // We don't filter by category since many valid raster layers have categories like "other" or "map"
  if (props.type !== 'tms' && props.type !== 'wms') {
    warn(`Skipping unsupported layer type: ${props.name} (type: ${props.type})`)
    return null
  }

  // Convert tile URL
  const converted = convertTileUrl(props.url, props.type)
  if (!converted) {
    warn(`Cannot convert tile URL for: ${props.name} (type: ${props.type})`)
    return null
  }

  // Handle attribution
  let attributionHtml = ''
  if (props.attribution?.text) {
    attributionHtml = props.attribution.text
  } else {
    warn(`Missing attribution for: ${props.name}, using empty string`)
  }

  // Build result object, only including optional fields if they exist
  const result: MapDataBackgroundSource<string> = {
    id: fileId,
    name: props.name,
    tiles: converted.tiles,
    attributionHtml,
  }

  // Only include optional fields if they exist
  if (props.min_zoom !== undefined) {
    result.minzoom = props.min_zoom
  }

  if (props.max_zoom !== undefined) {
    result.maxzoom = props.max_zoom
  }

  if (converted.tileSize !== undefined || props.tile_size !== undefined) {
    result.tileSize = converted.tileSize || props.tile_size
  }

  return result
}

async function main() {
  // Ensure raw directory exists (recursive: true won't error if it already exists)
  await fs.promises.mkdir(rawDir, { recursive: true })

  // Fetch and download files
  const files = await fetchFileList()
  log(`Found ${files.length} GeoJSON files`)

  for (const file of files) {
    await downloadFile(file.name)
  }

  // Parse and convert files
  log('Parsing and converting files')
  const convertedLayers: Array<{
    id: string
    name: string
    tiles: string
    attributionHtml: string
    maxzoom?: number
    minzoom?: number
    tileSize?: number
    legendUrl?: string
  }> = []

  const rawFiles = fs.readdirSync(rawDir).filter((f) => f.endsWith('.geojson'))
  for (const filename of rawFiles) {
    const filePath = path.join(rawDir, filename)
    const feature = await parseELIFile(filePath)

    if (!feature) {
      continue
    }

    const fileId = sanitizeId(filename)
    const converted = convertELIToMapDataBackgroundSource(feature, fileId)

    if (converted) {
      convertedLayers.push(converted)
    }
  }

  log(`Converted ${convertedLayers.length} layers`)

  // Sort by ID for consistent output
  convertedLayers.sort((a, b) => a.id.localeCompare(b.id))

  // Generate TypeScript file
  const typeIds = convertedLayers.map((layer) => `  | '${layer.id}'`).join('\n')

  const typeScriptContent = `// DO NOT EDIT MANUALLY
// This file was automatically generated by \`scripts/ELILayers/process.ts\`

import { MapDataBackgroundSource } from '@/src/app/regionen/[regionSlug]/_mapData/types'

export type SourcesRasterIdsELI =
${typeIds}

export const sourcesBackgroundsRasterELI: MapDataBackgroundSource<SourcesRasterIdsELI>[] = ${JSON.stringify(
    convertedLayers,
    null,
    2,
  )}
`

  await Bun.write(outputFile, typeScriptContent)
  log(`Generated ${outputFile}`)

  // Format with prettier

  // Format raw files with prettier
  log('Formatting raw files with prettier')
  Bun.spawnSync(['npx', 'prettier', '--write', rawDir], {
    onExit(_proc, exitCode, _signalCode, error) {
      if (exitCode) {
        warn(`Prettier exited with code ${exitCode} for ${rawDir}`)
      }
      if (error) {
        warn(`Prettier error for ${rawDir}: ${error}`)
      }
    },
  })
  log('Formatting output file with prettier')
  Bun.spawnSync(['npx', 'prettier', '--write', outputFile], {
    onExit(_proc, exitCode, _signalCode, error) {
      if (exitCode) {
        warn(`Prettier exited with code ${exitCode}`)
      }
      if (error) {
        warn(`Prettier error: ${error}`)
      }
    },
  })
}

main().catch((error) => {
  console.error(styleText('red', 'Error:'), error)
  process.exit(1)
})
