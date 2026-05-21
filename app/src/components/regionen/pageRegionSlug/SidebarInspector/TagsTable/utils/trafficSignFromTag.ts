import { trafficSignTagToSigns } from '@osm-traffic-signs/converter'
import type { SignStateType } from '@osm-traffic-signs/converter'

const countryPrefix = 'DE' satisfies 'DE'

export type TrafficSignDisplayItem = {
  key: string
  recognized: boolean
  label: string
  svgName: string | null
}

function signToDisplayItem(sign: SignStateType) {
  return {
    key: sign.osmValuePart,
    recognized: sign.recodgnizedSign,
    label: sign.descriptiveName,
    svgName: sign.recodgnizedSign ? sign.svgName : null,
  } satisfies TrafficSignDisplayItem
}

export function parseTrafficSignTag(raw: string | undefined) {
  if (raw === undefined) return undefined
  return trafficSignTagToSigns(raw, countryPrefix).map(signToDisplayItem)
}
