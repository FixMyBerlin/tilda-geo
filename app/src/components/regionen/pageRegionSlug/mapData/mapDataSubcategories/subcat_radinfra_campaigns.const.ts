import type { TodoId } from '@/data/processingTypes/todoId.generated.const'
import { todoIds } from '@/data/processingTypes/todoId.generated.const'
import { campaigns } from '@/data/radinfra-de/campaigns'
import { campaignCategorySelect } from '@/data/radinfra-de/schema/utils/campaignCategorySelect'
import type { FileMapDataSubcategory, FileMapDataSubcategoryStyleLegend } from '../types'
import { layers_radinfra_campaign } from './layers/radinfra_campaign'
import { wrapSourceLayers } from './layers/utils/wrapSourceLayers'

const subcatId = 'campaigns'
const source = 'atlas_todos_lines'
const sourceLayer = 'todos_lines'
export type SubcatRadinfraCampaignId = typeof subcatId
export type SubcatRadinfraCampaignStyleIds = 'default' | TodoId

const campaignLegend: FileMapDataSubcategoryStyleLegend[] = [
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
    desc: [
      'Prozessierte Mapillary Sequenzen. Der Abgleich mit Mapillary findet nur alle paar Wochen statt. [Datum der letzten Aktualisierung anzeigen](/docs/mapillary-coverage).',
    ],
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
      layers: wrapSourceLayers({
        layers: layers_radinfra_campaign,
        source,
        sourceLayer,
      }),
      legends: campaignLegend,
    },
    // NOTE: We still iterate over the generated campaign ids here.
    // This way we only show what the data really has.
    // And we also show unfinished campaigns that don't have text, yet.
    ...todoIds.map((todoId) => {
      const campaign = campaigns.find((c) => c.id === todoId)
      const category = campaignCategorySelect.find(
        (entry) => entry.value === campaign?.category,
      )?.label

      return {
        id: todoId,
        name: campaign?.title || `${todoId} (in Arbeit)`,
        category: category || 'In Vorbereitung',
        layers: wrapSourceLayers({
          layers: layers_radinfra_campaign,
          source,
          sourceLayer,
          additionalFilter: ['has', todoId],
        }),
        legends: campaignLegend,
      }
    }),
  ],
}
