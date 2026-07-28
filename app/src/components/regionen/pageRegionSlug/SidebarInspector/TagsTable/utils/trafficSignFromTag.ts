import { trafficSignTagToSigns } from '@osm-traffic-signs/converter'
import type { SignStateType } from '@osm-traffic-signs/converter'

export const trafficSignCountryPrefix = 'DE' satisfies 'DE'

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
    label: sign.descriptiveName ?? sign.osmValuePart,
    svgName: sign.recodgnizedSign ? sign.svgName : null,
  } satisfies TrafficSignDisplayItem
}

export function parseTrafficSignTag(raw: string | undefined) {
  if (raw === undefined) return undefined
  return trafficSignTagToSigns(raw, trafficSignCountryPrefix).map(signToDisplayItem)
}
