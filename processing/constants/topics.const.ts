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

export type TopicConfigBbox = [number, number, number, number]

export type TopicSchedule = 'nightly' | 'weekend'

export type TopicConfigEntry = {
  id: string
  bboxes: readonly TopicConfigBbox[] | null
  schedule: TopicSchedule
}

const bboxBerlin: TopicConfigBbox = [13.08283, 52.33446, 13.762245, 52.6783]
const bboxBiBi: TopicConfigBbox = [9.0671, 48.9229, 9.1753, 48.9838]
const bboxLoerrach: TopicConfigBbox = [7.63351, 47.5919, 7.72901, 47.67736]

const config = [
  { id: 'roads_bikelanes', bboxes: null, schedule: 'nightly' },
  { id: 'bikeroutes', bboxes: null, schedule: 'nightly' },
  { id: 'bicycleParking', bboxes: null, schedule: 'nightly' },
  { id: 'trafficSigns', bboxes: null, schedule: 'nightly' },
  { id: 'boundaries', bboxes: null, schedule: 'nightly' },
  { id: 'places', bboxes: null, schedule: 'nightly' },
  { id: 'publicTransport', bboxes: null, schedule: 'nightly' },
  { id: 'poiClassification', bboxes: null, schedule: 'nightly' },
  { id: 'barriers', bboxes: null, schedule: 'nightly' },
  // Weekend (~weekly): produces the `landuse` display table, the settlement-area source
  // (dissolved into public._settlement_areas by landcover.sql) and `_buildings`. Also runnable on
  // demand with PROCESS_ONLY_TOPICS=landcover.
  { id: 'landcover', bboxes: null, schedule: 'weekend' },
  { id: 'parking', bboxes: [bboxBerlin, bboxBiBi, bboxLoerrach], schedule: 'nightly' },
] as const satisfies readonly TopicConfigEntry[]

export type Topic = (typeof config)[number]['id']

export const topicsConfig: Map<Topic, TopicConfigEntry> = new Map(
  config.map((entry): [Topic, TopicConfigEntry] => [entry.id, entry]),
)
