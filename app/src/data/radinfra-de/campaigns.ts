import { adjoining_or_isolated } from './campaigns/adjoining_or_isolated'
import { advisory_or_exclusive } from './campaigns/advisory_or_exclusive'
import { advisory_or_exclusive_mapillary } from './campaigns/advisory_or_exclusive_mapillary'
import { currentness_too_old } from './campaigns/currentness_too_old'
import { currentness_too_old_mapillary } from './campaigns/currentness_too_old_mapillary'
import { deprecated_cycleway_shared } from './campaigns/deprecated_cycleway_shared'
import { deprecated_cycleway_shared_mapillary } from './campaigns/deprecated_cycleway_shared_mapillary'
import { malformed_traffic_sign } from './campaigns/malformed_traffic_sign'
import { malformed_traffic_sign_mapillary } from './campaigns/malformed_traffic_sign_mapillary'
import { missing_access_tag_240 } from './campaigns/missing_access_tag_240'
import { missing_access_tag_bicycle_road } from './campaigns/missing_access_tag_bicycle_road'
import { missing_oneway } from './campaigns/missing_oneway'
import { missing_oneway_mapillary } from './campaigns/missing_oneway_mapillary'
import { missing_segregated } from './campaigns/missing_segregated'
import { missing_segregated_mapillary } from './campaigns/missing_segregated_mapillary'
import { missing_surface } from './campaigns/missing_surface'
import { missing_surface_mapillary } from './campaigns/missing_surface_mapillary'
import { missing_traffic_sign } from './campaigns/missing_traffic_sign'
import { missing_traffic_sign_244 } from './campaigns/missing_traffic_sign_244'
import { missing_traffic_sign_244_mapillary } from './campaigns/missing_traffic_sign_244_mapillary'
import { missing_traffic_sign_mapillary } from './campaigns/missing_traffic_sign_mapillary'
import { missing_traffic_sign_vehicle_destination } from './campaigns/missing_traffic_sign_vehicle_destination'
import { missing_traffic_sign_vehicle_destination_mapillary } from './campaigns/missing_traffic_sign_vehicle_destination_mapillary'
import { missing_width } from './campaigns/missing_width'
import { missing_width_mapillary } from './campaigns/missing_width_mapillary'
import { mixed_cycleway_both } from './campaigns/mixed_cycleway_both'
import { mixed_cycleway_both_mapillary } from './campaigns/mixed_cycleway_both_mapillary'
import { needs_clarification } from './campaigns/needs_clarification'
import { needs_clarification_mapillary } from './campaigns/needs_clarification_mapillary'
import { needs_clarification_track } from './campaigns/needs_clarification_track'
import { needs_clarification_track_mapillary } from './campaigns/needs_clarification_track_mapillary'
import { unexpected_bicycle_access_on_footway } from './campaigns/unexpected_bicycle_access_on_footway'
import { unexpected_bicycle_access_on_footway_mapillary } from './campaigns/unexpected_bicycle_access_on_footway_mapillary'
import { CampaignSchema, CampaignType } from './schema/campaignsSchema'

const rawCampaigns = [
  adjoining_or_isolated,
  advisory_or_exclusive_mapillary,
  advisory_or_exclusive,
  currentness_too_old_mapillary,
  currentness_too_old,
  deprecated_cycleway_shared_mapillary,
  deprecated_cycleway_shared,
  malformed_traffic_sign_mapillary,
  malformed_traffic_sign,
  missing_access_tag_240,
  missing_access_tag_bicycle_road,
  missing_oneway_mapillary,
  missing_oneway,
  missing_segregated_mapillary,
  missing_segregated,
  missing_surface_mapillary,
  missing_surface,
  missing_traffic_sign_244_mapillary,
  missing_traffic_sign_244,
  missing_traffic_sign_mapillary,
  missing_traffic_sign_vehicle_destination_mapillary,
  missing_traffic_sign_vehicle_destination,
  missing_traffic_sign,
  missing_width_mapillary,
  missing_width,
  mixed_cycleway_both_mapillary,
  mixed_cycleway_both,
  needs_clarification_mapillary,
  needs_clarification_track_mapillary,
  needs_clarification_track,
  needs_clarification,
  unexpected_bicycle_access_on_footway_mapillary,
  unexpected_bicycle_access_on_footway,
]

function collectCampaigns(rawCampaigns: unknown[]) {
  const validCampaigns: CampaignType[] = []
  for (const campaign of rawCampaigns) {
    const parsed = CampaignSchema.safeParse(campaign)
    if (!parsed.success) {
      console.log(`ERROR collectCampaigns:`, parsed.error, campaign)
      continue
    }
    validCampaigns.push(parsed.data)
  }
  return validCampaigns
}

export const campaigns = collectCampaigns(rawCampaigns)
