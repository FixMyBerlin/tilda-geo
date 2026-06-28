// This list defines the topics that we process in the data pipeline.
// Each topic must have a folder /topics/<id> with the following files:
// - <id>.lua: the LUA entrypoint for the topic
// - <id>.sql: an optional SQL file to post-process the data
//
// Each entry is an object:
// - id:       the topic id (folder name)
// - bboxes:   optional list of Bbox. If set, a new osm2pgsql run is started on a filtered
//             osm file for those areas (otherwise the whole dataset is processed).
// - schedule: 'nightly' runs in every pipeline run; 'weekend' runs only on the Saturday nightly
//             run (Berlin time) — i.e. about once a week — or when explicitly
//             requested (PROCESS_ONLY_TOPICS=<id>). Use 'weekend' for heavy, rarely-changing
//             datasets (landcover, buildings, settlement-area source) so they stay out of the
//             nightly critical path; the extra hours are fine on a weekend.
// - tagFilterProfile: which osmium tag-filter profile supplies the topic's input PBF
//             (see topics.tagFilters.const.ts).

import type { TagFilterProfile } from './topics.tagFilters.const'

export type TopicConfigBbox = [number, number, number, number]

export type TopicSchedule = 'nightly' | 'weekend'

export type TopicConfigEntry = {
  id: string
  bboxes: readonly TopicConfigBbox[] | null
  schedule: TopicSchedule
  tagFilterProfile: TagFilterProfile
}

const bboxBerlin: TopicConfigBbox = [13.08283, 52.33446, 13.762245, 52.6783]
const bboxBiBi: TopicConfigBbox = [9.0671, 48.9229, 9.1753, 48.9838]

const config = [
  { id: 'roads_bikelanes', bboxes: null, schedule: 'nightly', tagFilterProfile: 'roadsBikelanes' },
  { id: 'bikeroutes', bboxes: null, schedule: 'nightly', tagFilterProfile: 'relations' },
  { id: 'bicycleParking', bboxes: null, schedule: 'nightly', tagFilterProfile: 'features' },
  { id: 'trafficSigns', bboxes: null, schedule: 'nightly', tagFilterProfile: 'roadsBikelanes' },
  { id: 'boundaries', bboxes: null, schedule: 'nightly', tagFilterProfile: 'relations' },
  { id: 'places', bboxes: null, schedule: 'nightly', tagFilterProfile: 'features' },
  { id: 'publicTransport', bboxes: null, schedule: 'nightly', tagFilterProfile: 'features' },
  { id: 'poiClassification', bboxes: null, schedule: 'nightly', tagFilterProfile: 'features' },
  { id: 'barriers', bboxes: null, schedule: 'nightly', tagFilterProfile: 'barriers' },
  // Weekend (~weekly): produces the `landuse` display table, the settlement-area source
  // (dissolved into public._settlement_areas by landcover.sql) and `_buildings`. Also runnable on
  // demand with PROCESS_ONLY_TOPICS=landcover.
  {
    id: 'landcover',
    bboxes: null,
    schedule: 'weekend',
    tagFilterProfile: 'landcover',
  },
  {
    id: 'parking',
    bboxes: [bboxBerlin, bboxBiBi],
    schedule: 'nightly',
    tagFilterProfile: 'monolithicUnion',
  },
] as const satisfies readonly TopicConfigEntry[]

export type Topic = (typeof config)[number]['id']

export const topicsConfig: Map<Topic, TopicConfigEntry> = new Map(
  config.map((entry): [Topic, TopicConfigEntry] => [entry.id, entry]),
)
