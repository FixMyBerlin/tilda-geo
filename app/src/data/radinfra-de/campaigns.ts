import { adjoining_or_isolated } from './campaigns/adjoining_or_isolated'
import { advisory_or_exclusive } from './campaigns/advisory_or_exclusive'
import { advisory_or_exclusive__mapillary } from './campaigns/advisory_or_exclusive__mapillary'
import { currentness_too_old } from './campaigns/currentness_too_old'
import { currentness_too_old__mapillary } from './campaigns/currentness_too_old__mapillary'
import { deprecated_cycleway_shared } from './campaigns/deprecated_cycleway_shared'
import { malformed_traffic_sign } from './campaigns/malformed_traffic_sign'
import { malformed_traffic_sign__mapillary } from './campaigns/malformed_traffic_sign__mapillary'
import { missing_access_tag_240 } from './campaigns/missing_access_tag_240'
import { missing_access_tag_bicycle_road } from './campaigns/missing_access_tag_bicycle_road'
import { missing_oneway } from './campaigns/missing_oneway'
import { missing_oneway__mapillary } from './campaigns/missing_oneway__mapillary'
import { missing_segregated } from './campaigns/missing_segregated'
import { missing_segregated__mapillary } from './campaigns/missing_segregated__mapillary'
import { missing_surface } from './campaigns/missing_surface'
import { missing_surface__mapillary } from './campaigns/missing_surface__mapillary'
import { missing_traffic_sign } from './campaigns/missing_traffic_sign'
import { missing_traffic_sign_244 } from './campaigns/missing_traffic_sign_244'
import { missing_traffic_sign_244__mapillary } from './campaigns/missing_traffic_sign_244__mapillary'
import { missing_traffic_sign__mapillary } from './campaigns/missing_traffic_sign__mapillary'
import { missing_traffic_sign_vehicle_destination } from './campaigns/missing_traffic_sign_vehicle_destination'
import { missing_traffic_sign_vehicle_destination__mapillary } from './campaigns/missing_traffic_sign_vehicle_destination__mapillary'
import { missing_width } from './campaigns/missing_width'
import { missing_width_surface_sett__mapillary } from './campaigns/missing_width_surface_sett__mapillary'
import { mixed_cycleway_both } from './campaigns/mixed_cycleway_both'
import { mixed_cycleway_both__mapillary } from './campaigns/mixed_cycleway_both__mapillary'
import { needs_clarification } from './campaigns/needs_clarification'
import { needs_clarification__mapillary } from './campaigns/needs_clarification__mapillary'
import { needs_clarification_track } from './campaigns/needs_clarification_track'
import { needs_clarification_track__mapillary } from './campaigns/needs_clarification_track__mapillary'
import { unexpected_bicycle_access_on_footway } from './campaigns/unexpected_bicycle_access_on_footway'
import { unexpected_bicycle_access_on_footway__mapillary } from './campaigns/unexpected_bicycle_access_on_footway__mapillary'
import { unexpected_highway_path } from './campaigns/unexpected_highway_path'
import { unexpected_highway_path__mapillary } from './campaigns/unexpected_highway_path__mapillary'
import { CampaignSchema } from './schema/campaignsSchema'

const rawCampaigns = [
  adjoining_or_isolated,
  advisory_or_exclusive__mapillary,
  advisory_or_exclusive,
  currentness_too_old__mapillary,
  currentness_too_old,
  deprecated_cycleway_shared,
  malformed_traffic_sign__mapillary,
  malformed_traffic_sign,
  missing_access_tag_240,
  missing_access_tag_bicycle_road,
  missing_oneway__mapillary,
  missing_oneway,
  missing_segregated__mapillary,
  missing_segregated,
  missing_surface__mapillary,
  missing_surface,
  missing_traffic_sign__mapillary,
  missing_traffic_sign_244__mapillary,
  missing_traffic_sign_244,
  missing_traffic_sign_vehicle_destination__mapillary,
  missing_traffic_sign_vehicle_destination,
  missing_traffic_sign,
  missing_width_surface_sett__mapillary,
  missing_width,
  mixed_cycleway_both__mapillary,
  mixed_cycleway_both,
  needs_clarification__mapillary,
  needs_clarification_track__mapillary,
  needs_clarification_track,
  needs_clarification,
  unexpected_bicycle_access_on_footway__mapillary,
  unexpected_bicycle_access_on_footway,
  unexpected_highway_path,
  unexpected_highway_path__mapillary,
]

const collectCampaigns = () => {
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

export const campaigns = collectCampaigns()
