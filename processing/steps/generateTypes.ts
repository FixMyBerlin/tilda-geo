import { $ } from 'bun'
import { join } from 'path'
import { TYPES_DIR } from '../constants/directories.const'
import { topicsConfig } from '../constants/topics.const'
import { getTopicTables } from '../diffing/diffing'
import { params } from '../utils/parameters'

/**
 * Generate types based on the processing tables.
 */
export async function generateTypes() {
  // Only generate type when in development
  if (params.environment !== 'development') return

  console.log('[DEV] Generating types...')

  writeTableIdTypes()
  writeTodoIdTypes()

  autoformatTypeFiles()
}

async function writeTableIdTypes() {
  if (params.processOnlyTopics.length > 0) {
    console.info('[DEV] Generating types:', 'Skipped because `PROCESS_ONLY_TOPICS` is present')
    return
  }

  const processedTables = new Set<string>()
  for (const [topic] of Array.from(topicsConfig)) {
    const topicTables = await getTopicTables(topic)
    topicTables.forEach((table) => processedTables.add(table))
  }

  const typeFile = join(TYPES_DIR, 'tableId.generated.const.ts')
  const content = prefixGeneratedFiles(
    `export type TableId = ${
      Array.from(processedTables)
        .sort()
        .map((tableName) => `'${tableName}'`)
        .join(' | ') || 'ERROR'
    }`,
  )

  await Bun.write(typeFile, content)
}

async function callLuaForNames(luaFilename: 'ExtractBikelaneTodos' | 'ExtractRoadTodos') {
  try {
    const rawResult = await $`lua /processing/utils/types/${luaFilename}.lua`.text()
    const lines = rawResult.split('\n').filter(Boolean).sort()
    const result = lines
      .map((line) => line.split(';'))
      .map(([id, todoTableOnly]) => {
        return { id, todoTableOnly: JSON.parse(todoTableOnly) as boolean }
      })
    return result
  } catch (error) {
    throw new Error(`[DEV] Failed to get names for "${luaFilename}": ${error}`)
  }
}

// The sort here is also the sort in the dropdown of the subcategory.
function sortMapillarySpecial(a: string, b: string) {
  // Remove __mapillary for base comparison
  const baseA = a.replace(/__mapillary$/, '')
  const baseB = b.replace(/__mapillary$/, '')
  if (baseA === baseB) {
    // If both are the same base, non-mapillary comes first
    if (a.endsWith('__mapillary')) return 1
    if (b.endsWith('__mapillary')) return -1
    return 0
  }
  return baseA < baseB ? -1 : 1
}

async function writeTodoIdTypes() {
  const typeFilePath = join(TYPES_DIR, 'todoId.generated.const.ts')
  const typeFile = Bun.file(typeFilePath)

  const bikelaneTodoNames = await callLuaForNames('ExtractBikelaneTodos')
  const bikelaneTodos = bikelaneTodoNames.map((e) => e.id).sort(sortMapillarySpecial)
  const bikelaneTodoNamesTableAndField = bikelaneTodoNames
    .filter((e) => e.todoTableOnly === false)
    .map((e) => e.id)
    .sort(sortMapillarySpecial)
  const bikelaneTodoNamesTableOnly = bikelaneTodoNames
    .filter((e) => e.todoTableOnly === true)
    .map((e) => e.id)
    .sort(sortMapillarySpecial)

  const roadTodoNames = await callLuaForNames('ExtractRoadTodos')
  const roadTodos = roadTodoNames.map((e) => e.id).sort(sortMapillarySpecial)
  const roadTodoNamesTableAndField = roadTodoNames
    .filter((e) => e.todoTableOnly === false)
    .map((e) => e.id)
    .sort(sortMapillarySpecial)
  const roadTodoNamesTableOnly = roadTodoNames
    .filter((e) => e.todoTableOnly === true)
    .map((e) => e.id)
    .sort(sortMapillarySpecial)

  const todos = [...bikelaneTodoNames, ...roadTodoNames].map((e) => e.id).sort(sortMapillarySpecial)

  const fileContent = `
  export const bikelaneTodoIds = [${bikelaneTodos.map((name) => `'${name}'`).join(',')}
  // (prettier: one line per entry)
  ] as const
  export type BikelaneTodoId = (typeof bikelaneTodoIds)[number]

  export const bikelaneTodoIdsTableAndField = [${bikelaneTodoNamesTableAndField.map((name) => `'${name}'`).join(',')}
  // (prettier: one line per entry)
  ] as const
  export type BikelaneTodoIdTableAndField = (typeof bikelaneTodoIdsTableAndField)[number]

  export const bikelaneTodoIdsTableOnly = [${bikelaneTodoNamesTableOnly.map((name) => `'${name}'`).join(',')}
  // (prettier: one line per entry)
  ] as const
  export type BikelaneTodoIdTableOnly = (typeof bikelaneTodoIdsTableOnly)[number]

  export const roadTodoIds = [${roadTodos.map((name) => `'${name}'`).join(',')}
  // (prettier: one line per entry)
  ] as const
  export type RoadTodoId = (typeof roadTodoIds)[number]

  export const roadTodoIdsTableAndField = [${roadTodoNamesTableAndField.map((name) => `'${name}'`).join(',')}
  // (prettier: one line per entry)
  ] as const
  export type RoadTodoIdTableAndField = (typeof roadTodoIdsTableAndField)[number]

  export const roadTodoIdsTableOnly = [${roadTodoNamesTableOnly.map((name) => `'${name}'`).join(',')}
  // (prettier: one line per entry)
  ] as const
  export type RoadTodoIdTableOnly = (typeof roadTodoIdsTableOnly)[number]

  export const todoIds = [${todos.map((name) => `'${name}'`).join(',')}
  // (prettier: one line per entry)
  ] as const
  export type TodoId = (typeof todoIds)[number]
  `

  const content = prefixGeneratedFiles(fileContent)
  await Bun.write(typeFile, content)
}

function prefixGeneratedFiles(content: string) {
  return `// DO NOT EDIT MANUALLY
// This file was automatically generated by \`processing/steps/generateTypes.ts\`
// To update, run \`docker compose up processing\` with ENV=development

${content}
`
}

async function autoformatTypeFiles() {
  try {
    await $`bunx prettier --experimental-cli -write --config=/processing/.prettierrc ${TYPES_DIR} > /dev/null`
  } catch (error) {
    throw new Error(`Failed to run prettier on auto generated types: ${error}`)
  }
}
