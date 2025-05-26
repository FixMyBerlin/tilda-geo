import { mapillaryCoverageDateString } from '@/src/data/mapillaryCoverage.const'
import { campaigns } from '@/src/data/radinfra-de/campaigns'
import { campaignCategorySelect } from '@/src/data/radinfra-de/schema/utils/campaignCategorySelect'
import { FileMapDataSubcategory, FileMapDataSubcategoryStyleLegend } from '../types'
import { mapboxStyleGroupLayers_radinfra_campaign } from './mapboxStyles/groups/radinfra_campaign'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'campaigns'
const source = 'atlas_todos_lines'
const sourceLayer = 'todos_lines'
export type SubcatRadinfraCampaignId = typeof subcatId
export type SubcatRadinfraCampaignStyleIds = 'default' | string

export const campaignLegend: FileMapDataSubcategoryStyleLegend[] = [
  {
    id: 'todo',
    name: 'Hier gibt es was zu tun',
    style: {
      type: 'line',
      color: '#fda5e4',
    },
  },
  {
    id: 'mapillary',
    name: 'Mapillary Fotos vorhanden',
    desc: [`Prozessierte Mapillary Sequenzen von ${mapillaryCoverageDateString}.`],
    style: {
      type: 'line',
      color: '#050dff',
    },
  },
]

export const subcat_radinfra_campaigns: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Kampagnen',
  ui: 'dropdown',
  beforeId: 'atlas-app-beforeid-top',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'Alle Kampagnen',
      desc: null,
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_radinfra_campaign,
        source,
        sourceLayer,
      }),
      legends: campaignLegend,
    },
    ...campaigns.map((campaign) => {
      const todoKey = campaign.todoKey
      const category = campaignCategorySelect.find(
        (entry) => entry.value === campaign?.category,
      )?.label

      return {
        id: campaign.id,
        name: campaign.title,
        category: category || 'In Vorbereitung',
        desc: null,
        layers: mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_radinfra_campaign,
          source,
          sourceLayer,
          additionalFilter: ['has', todoKey],
        }),
        legends: campaignLegend,
      }
    }),
  ],
}
