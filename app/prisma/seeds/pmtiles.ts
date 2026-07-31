import type { Prisma } from '@/prisma/generated/client'
import { layerConfigsCreateFromConfigs } from '@/server/uploads/mapDatasetLayerConfig.server'
import { parseMapDatasetUploadConfigs } from '@/server/uploads/mapDatasetUploadConfigs.schema'
import db from '../../src/server/db.server'

const lineLayer = {
  id: 'seed-static-line',
  type: 'line',
  paint: {
    'line-width': ['coalesce', ['get', 'felt:strokeWidth'], ['get', 'stroke-width'], 10],
    'line-color': ['to-color', ['get', 'felt:color'], ['get', 'stroke'], '#14b8a6'],
    'line-opacity': ['coalesce', ['get', 'felt:strokeOpacity'], ['get', 'stroke-opacity'], 0.6],
  },
  filter: ['match', ['get', 'Typ'], ['Zielnetz'], true, false],
}

const vectorConfigBase = {
  type: 'vector',
  inspector: {
    enabled: true,
    documentedKeys: false,
    disableTranslations: true,
  },
  layers: [lineLayer],
} as const

const testDataBaseUrl = 'https://atlas-private.s3.eu-central-1.amazonaws.com/test-data'

const seedUploads = async () => {
  const regionalNetworkUploads: Prisma.MapDatasetUploadUncheckedCreateInput[] = [
    {
      slug: 'regional-network-combined',
      pmtilesUrl: `${testDataBaseUrl}/nudafa-combined.pmtiles`,
      geojsonUrl: `${testDataBaseUrl}/nudafa-combined.geojson`,
      githubUrl:
        'https://github.com/FixMyBerlin/tilda-static-data/tree/main/geojson/region-nudafa/nudafa-combined',
      mapRenderFormat: 'pmtiles',
      mapRenderUrl: `${testDataBaseUrl}/nudafa-combined.pmtiles`,
      attributionHtml: '',
      configs: [
        {
          name: 'Zielnetz (Seed)',
          categoryKey: 'nudafa/general',
          ...vectorConfigBase,
        },
      ],
    },
  ]

  const parkraumCityUploads: Prisma.MapDatasetUploadUncheckedCreateInput[] = [
    {
      slug: 'parkraum-static-configs',
      pmtilesUrl: `${testDataBaseUrl}/two-configs.pmtiles`,
      geojsonUrl: `${testDataBaseUrl}/two-configs.geojson`,
      githubUrl:
        'https://github.com/FixMyBerlin/tilda-static-data/tree/main/geojson/region-bibi/two-configs',
      mapRenderFormat: 'pmtiles',
      mapRenderUrl: `${testDataBaseUrl}/two-configs.pmtiles`,
      attributionHtml: 'Seed-Daten',
      configs: [
        {
          name: 'Parkflächen eUVM (Seed)',
          subId: 'euvm',
          categoryKey: 'parkraum/euvm',
          ...vectorConfigBase,
        },
        {
          name: 'Weitere Parkdaten (Seed)',
          subId: 'misc',
          categoryKey: 'parkraum/misc',
          ...vectorConfigBase,
        },
      ],
    },
    {
      slug: 'parkraum-static-placeholder',
      pmtilesUrl: `${testDataBaseUrl}/two-configs.pmtiles`,
      geojsonUrl: `${testDataBaseUrl}/two-configs.geojson`,
      githubUrl:
        'https://github.com/FixMyBerlin/tilda-static-data/tree/main/geojson/region-bibi/two-configs',
      mapRenderFormat: 'pmtiles',
      mapRenderUrl: `${testDataBaseUrl}/two-configs.pmtiles`,
      attributionHtml: '',
      configs: [
        {
          name: 'Platzhalter-Datensatz (Seed)',
          categoryKey: null,
          ...vectorConfigBase,
        },
      ],
    },
  ]

  const regionalNetworkRegion = await db.region.findFirstOrThrow({
    where: { slug: 'dev-template-regional-network' },
  })
  for (const data of regionalNetworkUploads) {
    await db.mapDatasetUpload.create({
      data: {
        ...data,
        regions: { connect: { id: regionalNetworkRegion.id } },
        layerConfigs: {
          create: layerConfigsCreateFromConfigs(parseMapDatasetUploadConfigs(data.configs)),
        },
      },
    })
  }

  const parkraumCityRegion = await db.region.findFirstOrThrow({
    where: { slug: 'dev-template-parkraum-city' },
  })
  for (const data of parkraumCityUploads) {
    await db.mapDatasetUpload.create({
      data: {
        ...data,
        regions: { connect: { id: parkraumCityRegion.id } },
        layerConfigs: {
          create: layerConfigsCreateFromConfigs(parseMapDatasetUploadConfigs(data.configs)),
        },
      },
    })
  }
}

export default seedUploads
