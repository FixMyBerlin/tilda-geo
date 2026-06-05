import { bikelanesPresenceColors } from '@/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/subcat_bikelanes_plus_presence.const'
import { getDescriptionForInspectorTag } from '@/data/topicDocs/runtime'
import { TagsTableRowFrame } from '../TagsTableRow'
import { ConditionalFormattedValue } from '../translations/ConditionalFormattedValue'
import { ValueDisclosure, ValueDisclosureButton, ValueDisclosurePanel } from '../ValueDisclosure'
import type { CompositTableRow } from './types'

const CompositRoadBikelanesTableValue = ({
  tagKey,
  tagValue,
}: {
  tagKey: 'bikelane_left' | 'bikelane_self' | 'bikelane_right'
  tagValue: string
}) => {
  // All other values (that are not in the array above) are the bikelane-category values
  // which are translated in `ALL-category=*`. To access them, we overwrite the `tagKey`.
  const hasPresenceValue = ['not_expected', 'data_no', 'missing', 'assumed_no'].includes(tagValue)
  const hasSpecificInfrastructureValue = !hasPresenceValue
  const description = getDescriptionForInspectorTag('atlas_roads', tagKey, tagValue)
  const hasDescription = Boolean(description)
  const hasDisclosureBody = hasDescription || hasSpecificInfrastructureValue

  return (
    <ValueDisclosure>
      <ValueDisclosureButton hasBody={hasDisclosureBody}>
        <div className="flex items-center justify-between gap-2">
          <ConditionalFormattedValue
            sourceId="atlas_roads"
            tagKey="bikelane_SIDE"
            tagValue={hasSpecificInfrastructureValue ? 'data_present' : tagValue}
          />

          <div
            className="size-4 flex-none rounded-full"
            style={{
              backgroundColor: hasSpecificInfrastructureValue
                ? bikelanesPresenceColors.data_present
                : bikelanesPresenceColors[tagValue as keyof typeof bikelanesPresenceColors],
            }}
          />
        </div>
      </ValueDisclosureButton>
      <ValueDisclosurePanel>
        {hasDescription && <p>{description}</p>}
        {/* Show the bicycle `category` if the infrastructure is specific */}
        {hasSpecificInfrastructureValue && (
          <ConditionalFormattedValue sourceId="atlas_roads" tagKey="category" tagValue={tagValue} />
        )}
      </ValueDisclosurePanel>
    </ValueDisclosure>
  )
}

export const tableKeyRoadBikelanes = 'composit_road_bikelanes'
export const TagsTableRowCompositRoadBikelanes = ({
  sourceId: _hard_coded_atlas_roads,
  properties,
}: CompositTableRow) => {
  // Only show when one of those keys is present
  if (!(properties.bikelane_left || properties.bikelane_right || properties.bikelane_self)) {
    return null
  }

  return (
    <TagsTableRowFrame label="Radinfrastruktur">
      <table className="w-full leading-4">
        <tbody>
          <tr>
            <th className="py-1 pr-2 text-left font-medium">Links</th>
            <td className="w-full py-1">
              <CompositRoadBikelanesTableValue
                tagKey="bikelane_left"
                tagValue={properties.bikelane_left}
              />
            </td>
          </tr>
          <tr className="border-t">
            <th className="py-1 pr-2 text-left font-medium">Fahrbahn</th>
            <td className="w-full py-1">
              <CompositRoadBikelanesTableValue
                tagKey="bikelane_self"
                tagValue={properties.bikelane_self}
              />
            </td>
          </tr>
          <tr className="border-t">
            <th className="py-1 pr-2 text-left font-medium">Rechts</th>
            <td className="w-full py-1">
              <CompositRoadBikelanesTableValue
                tagKey="bikelane_right"
                tagValue={properties.bikelane_right}
              />
            </td>
          </tr>
        </tbody>
      </table>
      <p className="mt-1 text-xs text-gray-400">
        Angaben in OSM-Linienrichtung. Siehe Doppelpfeil ab Zoom 13.
      </p>
    </TagsTableRowFrame>
  )
}
