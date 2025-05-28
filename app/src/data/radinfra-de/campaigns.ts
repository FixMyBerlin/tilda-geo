import { adjoining_or_isolated } from './campaigns/adjoining_or_isolated'
import { advisory_or_exclusive } from './campaigns/advisory_or_exclusive'
import { currentness_too_old } from './campaigns/currentness_too_old'
import { deprecated_cycleway_shared } from './campaigns/deprecated_cycleway_shared'
import { malformed_traffic_sign } from './campaigns/malformed_traffic_sign'
import { missing_access_tag_240 } from './campaigns/missing_access_tag_240'
import { missing_access_tag_bicycle_road } from './campaigns/missing_access_tag_bicycle_road'
import { missing_oneway } from './campaigns/missing_oneway'
import { missing_segregated } from './campaigns/missing_segregated'
import { missing_surface } from './campaigns/missing_surface'
import { missing_traffic_sign } from './campaigns/missing_traffic_sign'
import { missing_traffic_sign_244 } from './campaigns/missing_traffic_sign_244'
import { missing_traffic_sign_vehicle_destination } from './campaigns/missing_traffic_sign_vehicle_destination'
import { missing_width } from './campaigns/missing_width'
import { missing_width_surface_sett__mapillary } from './campaigns/missing_width_surface_sett__mapillary'
import { mixed_cycleway_both } from './campaigns/mixed_cycleway_both'
import { needs_clarification } from './campaigns/needs_clarification'
import { needs_clarification_track } from './campaigns/needs_clarification_track'
import { unexpected_bicycle_access_on_footway } from './campaigns/unexpected_bicycle_access_on_footway'
import { CampaignSchema } from './schema/campaignsSchema'

const rawCampaigns = [
  adjoining_or_isolated,
  advisory_or_exclusive,
  missing_access_tag_240,
  missing_access_tag_bicycle_road,
  missing_segregated,
  mixed_cycleway_both,
  needs_clarification,
  needs_clarification_track,
  unexpected_bicycle_access_on_footway,
  currentness_too_old,
  malformed_traffic_sign,
  missing_surface,
  missing_traffic_sign,
  missing_traffic_sign_244,
  missing_traffic_sign_vehicle_destination,
  missing_width_surface_sett__mapillary,
  missing_width,
  deprecated_cycleway_shared,
  missing_oneway,
]

const collectCampaigns = (rawCampaigns) => {
  return rawCampaigns
    .map((campaign) => {
      const parsed = CampaignSchema.safeParse(campaign)
      if (!parsed.success) {
        console.log(`ERROR collectRadinfraDeCampaigns:`, parsed.error, campaign)
        return
      }
      return parsed.data
    })
    .filter(Boolean)
}

export const campaigns = collectCampaigns(rawCampaigns)
