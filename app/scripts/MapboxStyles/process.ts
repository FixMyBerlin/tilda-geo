// We use bun.sh to run this file
import { MAPTILER_API_KEY } from '@/src/app/regionen/[regionSlug]/_components/Map/utils/maptilerApiKey.const'
import { styleText } from 'node:util'
import fs from 'node:fs'
import path from 'node:path'
import { mergeSprites } from './mergeSprites'
import { fetchStyle, log, saveJson } from './util'

console.log(styleText(['inverse', 'bold'], 'START'), __filename)

// Configuration
const baseMapStyle = `https://api.maptiler.com/maps/08357855-50d4-44e1-ac9f-ea099d9de4a5/style.json?key=${MAPTILER_API_KEY}`
const keys = [
  'tilda-style-package-1',
  'tilda-style-package-2',
  'tilda-style-package-3-radinfra',
  'tilda-style-package-4-parkraum',
  'parking',
]
const apiConfigs = [
  // The order in this array specifies which sprite "wins" when sprite filenames are identical (the last entry "wins")
  {
    key: 'parking',
    // Style https://studio.mapbox.com/styles/osm-verkehrswende/clev6ho1i00hd01o9bfo80n9q/edit/#17.14/52.484928/13.430058
    enabled: process.env.MAPBOX_PARKING_STYLE_ACCESS_TOKEN,
    apiUrl: `https://api.mapbox.com/styles/v1/osm-verkehrswende/clev6ho1i00hd01o9bfo80n9q?fresh=true&access_token=${process.env.MAPBOX_PARKING_STYLE_ACCESS_TOKEN}`,
    mapboxGroupPrefix: ['parking_'],
  },
  {
    key: 'tilda-style-package-4-parkraum',
    // Style https://studio.mapbox.com/styles/hejco/cmbf4ffqq000701qxe5oedq4v/edit/#13.49/48.95568/9.13281
    enabled: process.env.MAPBOX_STYLE_ACCESS_TOKEN,
    apiUrl: `https://api.mapbox.com/styles/v1/hejco/cmbf4ffqq000701qxe5oedq4v?fresh=true&access_token=${process.env.MAPBOX_STYLE_ACCESS_TOKEN}`,
    mapboxGroupPrefix: ['tilda_'],
  },
  {
    key: 'tilda-style-package-3-radinfra',
    // Style https://studio.mapbox.com/styles/hejco/cm5qlrsda004401sb9c3bbc6w/edit/#13.49/48.95568/9.13281
    enabled: process.env.MAPBOX_STYLE_ACCESS_TOKEN,
    apiUrl: `https://api.mapbox.com/styles/v1/hejco/cm5qlrsda004401sb9c3bbc6w?fresh=true&access_token=${process.env.MAPBOX_STYLE_ACCESS_TOKEN}`,
    mapboxGroupPrefix: ['tilda_', 'radinfra_'],
  },
  {
    key: 'tilda-style-package-2',
    // Style https://studio.mapbox.com/styles/hejco/clfs9mdh9007n01t6lw99gyqr/edit/#13.49/48.95568/9.13281
    enabled: process.env.MAPBOX_STYLE_ACCESS_TOKEN,
    apiUrl: `https://api.mapbox.com/styles/v1/hejco/clfs9mdh9007n01t6lw99gyqr?fresh=true&access_token=${process.env.MAPBOX_STYLE_ACCESS_TOKEN}`,
    mapboxGroupPrefix: ['tilda_', 'atlas_'],
  },
  {
    key: 'tilda-style-package-1',
    // Style https://studio.mapbox.com/styles/hejco/cl706a84j003v14o23n2r81w7/edit/#13.49/48.95568/9.13281
    enabled: process.env.MAPBOX_STYLE_ACCESS_TOKEN,
    apiUrl: `https://api.mapbox.com/styles/v1/hejco/cl706a84j003v14o23n2r81w7?fresh=true&access_token=${process.env.MAPBOX_STYLE_ACCESS_TOKEN}`,
    mapboxGroupPrefix: ['tilda_', 'atlas_'],
  },
].filter((c) => c.enabled)

// Folder
const scriptJsonFolder = 'scripts/MapboxStyles/json'
const groupFolder = 'src/app/regionen/[regionSlug]/_mapData/mapDataSubcategories/mapboxStyles'

// Sprites
export type SpriteSource = { url: string; searchParams?: { access_token: string | null } }
const spriteUrls: SpriteSource[] = []

// ============= Collect data per `apiConfig`

type GroupsLayer = { folderName: string; layers: mapboxgl.AnyLayer[] }
const groupsAndLayers: Record<string, GroupsLayer[]> = Object.fromEntries(keys.map((k) => [k, []]))
const metaFileContent: Record<string, any> = Object.fromEntries(keys.map((k) => [k, undefined]))

for (const { key, apiUrl, mapboxGroupPrefix } of apiConfigs) {
  const rawData: any = await fetchStyle(key, apiUrl, scriptJsonFolder)

  // Script: Remove all non-FMC-groups
  type MapBoxGroupEntry = { name: string; collapsed: boolean }

  // Get Groups from Mapbox-metadata, which is the only place where ID and Name are matched
  const groups = Object.entries(rawData.metadata['mapbox:groups'])
    .map((entry) => {
      const key = entry[0] as string
      const values = entry[1] as MapBoxGroupEntry
      if (mapboxGroupPrefix.some((prefix) => values.name.startsWith(prefix))) {
        return {
          folderId: key,
          folderName: values.name,
        }
      }
      return null
    })
    .filter(Boolean)

  log(`${key}: Received ${groups.length} groups`)

  // Script: For each group, collect the layers:
  // Create our own data
  groupsAndLayers[key] = groups.map((group) => {
    return {
      folderName: group.folderName,
      layers: rawData.layers.filter((layer) => {
        return layer.metadata && layer.metadata['mapbox:group'] == group.folderId
      }),
    }
  })

  // Cleanup keys from layers that we don't need or that we need to add ourselved later:
  groupsAndLayers[key]?.forEach((g) =>
    g.layers.forEach((layer: any) => {
      delete layer.metadata
      delete layer.source
      delete layer.slot // Does not exict on maplibre
      delete layer['source-layer']
      delete layer?.layout?.visibility // The source styles are sometimes set hidden; we need to reset this
      if (layer?.layout && Object.keys(layer.layout).length === 0) {
        delete layer.layout
      }
    }),
  )

  // Cleanup layer names & collect debugging info
  const changedNamesForDebugging: {
    folderName: string
    cleanFolderName: string
  }[] = []
  groupsAndLayers[key]?.forEach((g) => {
    const folderName = g.folderName
    const cleanFolderName = folderName.toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (folderName !== cleanFolderName) {
      g.folderName = cleanFolderName
      changedNamesForDebugging.push({ folderName, cleanFolderName })
    }
  })
  if (changedNamesForDebugging.length) {
    log(`${key}: ${changedNamesForDebugging.length} group names where renamed:`, {
      changedNamesForDebugging,
    })
  }

  metaFileContent[key] = {
    key,
    about: `Metadata on the last processing of the ${key} styles api response`,
    processed_at: new Date().toLocaleString('de-DE'),
    style_last_published: {
      published_at: new Date(rawData.modified).toLocaleString('de-DE'),
      version: rawData.version,
    },
    style_id: rawData.id,
    style_owner: rawData.owner,
    style_name: rawData.name,
    debug_changed_names: {
      about: `The folder names in Mapbox need to follow a pattern of \`${mapboxGroupPrefix.join(' or ')}[DataIdentifier]_[OptionalStyleIdentifier]\`, otherwise the script will create unexpected results. During processing, we cleanup the names. If any names show up below, those need to be fixed in Mapbox to prevent errors.`,
      changedNamesForDebugging,
    },
  }

  spriteUrls.push({
    url: `${rawData.sprite.replace(
      'mapbox://sprites/',
      'https://api.mapbox.com/styles/v1/',
    )}/sprite`,
    searchParams: {
      access_token: new URL(apiUrl).searchParams.get('access_token'),
    },
  })
}

// ============= Now, we bring all `apiConfigs` back together

const mergedGroupAndLayers = Object.values(groupsAndLayers)
  .map((layers) => layers)
  .flat()
  .filter((layers) => layers.layers.length > 0) // Delete empty folders, which are hidden Mapbox so they cannot be deleted in the UI

// Sort layer properties according to spec: id, type, filter, minzoom, maxzoom, layout, paint
// Inside paint/layout: filter first (if present), then A-Z
function sortLayerProperties(layer: any) {
  if (!layer || typeof layer !== 'object' || Array.isArray(layer)) {
    return layer
  }

  // Define the order for top-level properties
  const topLevelOrder = ['id', 'type', 'filter', 'minzoom', 'maxzoom', 'layout', 'paint']

  // Create sorted object
  const sorted: any = {}

  // First, add properties in the specified order
  for (const key of topLevelOrder) {
    if (key in layer) {
      if (key === 'layout' || key === 'paint') {
        // Sort nested paint/layout objects
        sorted[key] = sortPaintOrLayout(layer[key])
      } else {
        sorted[key] = layer[key]
      }
    }
  }

  // Then add any remaining properties (shouldn't happen, but for safety)
  for (const key of Object.keys(layer)) {
    if (!topLevelOrder.includes(key)) {
      sorted[key] = layer[key]
    }
  }

  return sorted
}

function sortPaintOrLayout(obj: any) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj
  }

  const sorted: any = {}
  const keys = Object.keys(obj)

  // Put 'filter' first if it exists
  if ('filter' in obj) {
    sorted.filter = obj.filter
  }

  // Sort remaining keys alphabetically
  const otherKeys = keys.filter((k) => k !== 'filter').sort((a, b) => a.localeCompare(b))
  for (const key of otherKeys) {
    sorted[key] = obj[key]
  }

  return sorted
}

// Cleanup, then write files
const styleFolder = `${groupFolder}/groups`
fs.rmSync(styleFolder, { recursive: true, force: true })
for (const group of mergedGroupAndLayers) {
  // Sort layers before serialization
  const sortedLayers = group.layers.map((layer) => sortLayerProperties(layer))

  const groupFile = `// DO NOT EDIT MANUALLY
// This file was automatically generated by \`scripts/MapboxStyles/process.ts\`

import { MapboxStyleLayer } from '../types'

export const mapboxStyleGroupLayers_${group.folderName}: MapboxStyleLayer[] = ${JSON.stringify(
    sortedLayers,
    null,
    2,
  )}
  `
  const stylesFile = path.join(styleFolder, `${group.folderName}.ts`)
  await Bun.write(stylesFile, groupFile)
  log(`Write stylesFile`, stylesFile)
}

// Script: Generate types file
// A type that represents all keys of the layers we generate
// (Don't change the new lines and spaces in this template; the generated output does fit Prettier conventions.)
const _layers = mergedGroupAndLayers.map((g) => g.layers).flat()
const _layerKeys = _layers.map((l) => Object.keys(l)).flat()
const deduplicatedLayerKeys = Array.from(new Set(_layerKeys)).sort((a, b) => a.localeCompare(b))
const typesFileContent = `// DO NOT EDIT MANUALLY
// This file was automatically generated by \`scripts/MapboxStyles/process.ts\`

// This type is used in \`mapboxStyleLayers\` and gives some visibility into what kind of data we fetch from Mapbox.
export type MapboxStyleLayer = {${deduplicatedLayerKeys
  .map((key) => {
    const optional = key === 'id' ? '' : '?'
    return `${key}${optional}: any;\n`
  })
  .join('')}}`

const typeFileName = path.join(groupFolder, 'types.ts')
await Bun.write(typeFileName, typesFileContent)
log(`Write typesFile`, typeFileName)

await Bun.write(
  path.join(scriptJsonFolder, 'metadata_last_process.json'),
  JSON.stringify(metaFileContent, null, 2),
)
log(`Store metadata on processing`, metaFileContent)

// ============= Last, we handle sprites and create a new style.json

const originalBaseMapStyle = await fetchStyle('base', baseMapStyle, scriptJsonFolder)
// Store the original style. See README for more.
await saveJson('src/app/api/map-style/style.json', originalBaseMapStyle)

// Create a merged sprite for pixelRatio 1 and 2
spriteUrls.push({ url: originalBaseMapStyle.sprite })
log('Merge sprites', spriteUrls)
await mergeSprites(spriteUrls, 1)
await mergeSprites(spriteUrls, 2)
