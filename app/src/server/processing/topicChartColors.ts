import type { TopicId } from '@/data/processingTypes/topicId.generated.const'

export type TopicChartHue =
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'pink'
  | 'rose'
  | 'orange'
  | 'amber'
  | 'lime'
  | 'teal'
  | 'cyan'

export const topicChartHueById: Record<TopicId, TopicChartHue> = {
  roads_bikelanes: 'blue',
  bikeroutes: 'indigo',
  bicycleParking: 'violet',
  trafficSigns: 'purple',
  boundaries: 'pink',
  places: 'rose',
  publicTransport: 'orange',
  poiClassification: 'amber',
  barriers: 'lime',
  landcover: 'teal',
  parking: 'cyan',
}

const luaBg: Record<TopicChartHue, string> = {
  blue: 'bg-blue-400',
  indigo: 'bg-indigo-400',
  violet: 'bg-violet-400',
  purple: 'bg-purple-400',
  pink: 'bg-pink-400',
  rose: 'bg-rose-400',
  orange: 'bg-orange-400',
  amber: 'bg-amber-400',
  lime: 'bg-lime-400',
  teal: 'bg-teal-400',
  cyan: 'bg-cyan-400',
}

const sqlBg: Record<TopicChartHue, string> = {
  blue: 'bg-blue-600',
  indigo: 'bg-indigo-600',
  violet: 'bg-violet-600',
  purple: 'bg-purple-600',
  pink: 'bg-pink-600',
  rose: 'bg-rose-600',
  orange: 'bg-orange-600',
  amber: 'bg-amber-600',
  lime: 'bg-lime-600',
  teal: 'bg-teal-600',
  cyan: 'bg-cyan-600',
}

const luaDotFill: Record<TopicChartHue, string> = {
  blue: 'fill-blue-400',
  indigo: 'fill-indigo-400',
  violet: 'fill-violet-400',
  purple: 'fill-purple-400',
  pink: 'fill-pink-400',
  rose: 'fill-rose-400',
  orange: 'fill-orange-400',
  amber: 'fill-amber-400',
  lime: 'fill-lime-400',
  teal: 'fill-teal-400',
  cyan: 'fill-cyan-400',
}

export const getTopicLuaBgClass = (topicId: TopicId) => luaBg[topicChartHueById[topicId]]

export const getTopicSqlBgClass = (topicId: TopicId) => sqlBg[topicChartHueById[topicId]]

export const getTopicLuaDotFillClass = (topicId: TopicId) => luaDotFill[topicChartHueById[topicId]]

const sqlDotFill: Record<TopicChartHue, string> = {
  blue: 'fill-blue-600',
  indigo: 'fill-indigo-600',
  violet: 'fill-violet-600',
  purple: 'fill-purple-600',
  pink: 'fill-pink-600',
  rose: 'fill-rose-600',
  orange: 'fill-orange-600',
  amber: 'fill-amber-600',
  lime: 'fill-lime-600',
  teal: 'fill-teal-600',
  cyan: 'fill-cyan-600',
}

export const getTopicLuaFillClass = (topicId: TopicId) => luaDotFill[topicChartHueById[topicId]]

export const getTopicSqlFillClass = (topicId: TopicId) => sqlDotFill[topicChartHueById[topicId]]
