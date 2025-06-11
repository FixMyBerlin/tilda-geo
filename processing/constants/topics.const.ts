// This list defines the topics that we process in the data pipeline.
// Each topic must have a folder /topics/<topic> with the following files:
// - <topic>.lua: the LUA entrypoint for the topic
// - <topic>.sql: an optional SQL file to post-process the data
// Topics can have an array of Bbox.
// If they have, a new osm2pgsql run is started based on a filtered osm file for those areas.

type Entries = typeof config
export type Topic = Entries[number][0]

export type TopicConfigBbox = [number, number, number, number]
export type TopicsConfig = Record<string, null | Array<TopicConfigBbox>>

const bboxBerlin: TopicConfigBbox = [13.08283, 52.33446, 13.762245, 52.6783]
const bboxBiBi: TopicConfigBbox = [9.0671, 48.9229, 9.1753, 48.9838]

const config = [
  ['roads_bikelanes', null],
  ['bikeroutes', null],
  ['bicycleParking', null],
  ['trafficSigns', null],
  ['boundaries', null],
  ['places', null],
  ['publicTransport', null],
  ['poiClassification', null],
  ['barriers', null],
  ['landuse', null], // requires roads_bikelanes, places
  ['parking', [bboxBerlin, bboxBiBi]],
] as const

export const topicsConfig = new Map(config)
