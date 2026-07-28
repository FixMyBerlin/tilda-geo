import { join } from 'node:path'
import { CONSTANTS_DIR, DATA_TABLE_DIR, TOPIC_DIR } from '../constants/directories.const'
import type { Topic } from '../constants/topics.const'
import { directoryHasChanged, updateDirectoryHash } from './hashing'
import { params } from './parameters'

export type SkipUnchangedContext = {
  skipCode: boolean
  helpersChanged: boolean
  constantsDirChanged: boolean
  dataTablesDirChanged: boolean
}

export const topicPath = (topic: Topic) => join(TOPIC_DIR, topic)

export const roadsBikelanesSidepathDir = join(TOPIC_DIR, 'roads_bikelanes/pseudo_tags_sidepath')

export const roadsBikelanesSettlementAreaDir = join(
  TOPIC_DIR,
  'roads_bikelanes/pseudo_tags_settlement_area',
)

export async function getSkipUnchangedContext(fileChanged: boolean) {
  const helperPath = join(TOPIC_DIR, 'helper')
  const helpersChanged = await directoryHasChanged(helperPath)
  updateDirectoryHash(helperPath)
  if (helpersChanged) {
    console.log('ℹ️ Helpers have changed. Rerunning all code.')
  }

  const constantsDirChanged = await directoryHasChanged(CONSTANTS_DIR)
  updateDirectoryHash(CONSTANTS_DIR)
  if (constantsDirChanged) {
    console.log('ℹ️ processing/constants have changed. Rerunning all code.')
  }

  const dataTablesDirChanged = await directoryHasChanged(DATA_TABLE_DIR)
  updateDirectoryHash(DATA_TABLE_DIR)
  if (dataTablesDirChanged) {
    console.log('ℹ️ processing/dataTables have changed. Rerunning all code.')
  }

  const skipCode =
    params.skipUnchanged &&
    !helpersChanged &&
    !constantsDirChanged &&
    !dataTablesDirChanged &&
    !fileChanged

  return {
    skipCode,
    helpersChanged,
    constantsDirChanged,
    dataTablesDirChanged,
  } satisfies SkipUnchangedContext
}

export async function willSkipTopic(
  topic: Topic,
  fileChanged: boolean,
  context?: SkipUnchangedContext,
) {
  const ctx = context ?? (await getSkipUnchangedContext(fileChanged))

  if (params.processOnlyTopics.length > 0 && !params.processOnlyTopics.includes(topic)) {
    return true
  }

  const topicChanged = await directoryHasChanged(topicPath(topic))
  if (ctx.skipCode && !topicChanged) {
    return true
  }

  return false
}
