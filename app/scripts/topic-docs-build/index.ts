#!/usr/bin/env bun
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { compileAttributesForDoc } from './attributeResolution'
import { compileChapters } from './chapters'
import { addInspectorTranslationsForSource } from './inspector'
import {
  docsByTableNameFromParsed,
  parseTopicYaml,
  readGroupsYaml,
  readTopicYamlFiles,
  tableNameFromYamlPath,
} from './io'
import type { MasterportalTableOutput } from './masterportal'
import { buildMasterportalMap } from './masterportal'
import { inputRoot, outputRoot } from './paths'
import type { CompiledTopicDoc, InspectorAttributes, InspectorDescriptions } from './types'

// These outputs are committed to git, so they must be byte-stable. Sort every emitted record by
// key — `readdir()` order is runtime/filesystem-dependent (e.g. macOS dev vs CI Linux, and it
// differed between Bun and Node), which would otherwise reorder the generated files spuriously.
const sortRecordByKey = <T>(map: Record<string, T>): Record<string, T> =>
  Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b, 'en')))

const writeTsModule = async ({
  filePath,
  data,
  typeImport,
  satisfiesType,
}: {
  filePath: string
  data: unknown
  typeImport?: string
  satisfiesType?: string
}) => {
  const importLine = typeImport ? `${typeImport}\n\n` : ''
  const satisfiesClause = satisfiesType ? ` satisfies ${satisfiesType}` : ''
  const content = `${importLine}const data = ${JSON.stringify(data, null, 2)} as const${satisfiesClause}\n\nexport default data\n`
  await mkdir(path.dirname(filePath), { recursive: true })
  await Bun.write(filePath, content)
}

export const main = async () => {
  const yamlFiles = await readTopicYamlFiles()
  if (!yamlFiles.length) {
    throw new Error(`No *.yaml files found in ${inputRoot}`)
  }

  const parsedDocs = await Promise.all(yamlFiles.map((filePath) => parseTopicYaml(filePath)))
  const docsByTableName = docsByTableNameFromParsed(parsedDocs)
  const groupsConfig = await readGroupsYaml()
  const groupsByTableName = new Map<string, Array<{ id: string; label?: string }>>()
  if (groupsConfig) {
    for (const group of groupsConfig.groups) {
      for (const tableName of group.tables) {
        const current = groupsByTableName.get(tableName) ?? []
        current.push({ id: group.id, label: group.label })
        groupsByTableName.set(tableName, current)
      }
    }
  }

  const byTableName: Record<string, CompiledTopicDoc> = {}
  const inspectorTranslations: Record<string, string> = {}
  const inspectorDescriptions: InspectorDescriptions = {}
  const masterportalByTableName: Record<string, MasterportalTableOutput> = {}

  for (const parsedDoc of parsedDocs) {
    const { data: doc, filePath } = parsedDoc
    const topicDir = path.dirname(filePath)
    const topic = path.basename(topicDir)
    const tableName = tableNameFromYamlPath(filePath)
    const chapters = await compileChapters(topicDir)
    const groups = groupsByTableName.get(tableName) ?? []

    const compiledAttributes = compileAttributesForDoc({
      doc,
      tableName,
      docsByTableName,
    })

    const masterportal = buildMasterportalMap(compiledAttributes)

    const compiledDoc: CompiledTopicDoc = {
      topic,
      tableName,
      sourceIds: doc.sourceIds,
      title: doc.title,
      summary: doc.summary,
      groups,
      attributes: compiledAttributes,
      chapters,
    }
    byTableName[tableName] = compiledDoc
    masterportalByTableName[tableName] = masterportal

    for (const sourceId of doc.sourceIds) {
      addInspectorTranslationsForSource({
        sourceId,
        title: doc.title,
        compiledAttributes,
        map: inspectorTranslations,
        descriptions: inspectorDescriptions,
        filePath,
      })
    }
  }

  // Slim lookups for the map page, which must not load the full docs. Iterate in emitted key order
  // so "first table wins" for a source's attribute matches a lookup over `byTableName.gen.ts`.
  const titlesByTableName: Record<string, string> = {}
  const inspectorAttributes: InspectorAttributes = {}
  for (const doc of Object.values(sortRecordByKey(byTableName))) {
    titlesByTableName[doc.tableName] = doc.title
    for (const sourceId of doc.sourceIds) {
      const bySourceKey = (inspectorAttributes[sourceId] ??= {})
      // Type and purpose each come from the first table that sets them.
      for (const attribute of doc.attributes) {
        const entry = (bySourceKey[attribute.key] ??= { type: attribute.type })
        if (attribute.purpose) entry.purpose ??= attribute.purpose
      }
    }
  }

  await rm(outputRoot, { recursive: true, force: true })
  await mkdir(outputRoot, { recursive: true })

  await writeTsModule({
    filePath: path.resolve(outputRoot, 'byTableName.gen.ts'),
    data: sortRecordByKey(byTableName),
    typeImport: "import type { TopicDocCompiled } from '../../topicDocs/runtime'",
    satisfiesType: 'Partial<Record<string, TopicDocCompiled>>',
  })
  await writeTsModule({
    filePath: path.resolve(outputRoot, 'masterportalByTableName.gen.ts'),
    data: sortRecordByKey(masterportalByTableName),
    typeImport:
      "import type { TopicDocMasterportalGfiConfig } from '../../topicDocs/masterportalGfi.types'",
    satisfiesType: 'Partial<Record<string, TopicDocMasterportalGfiConfig>>',
  })
  await writeTsModule({
    filePath: path.resolve(outputRoot, 'titlesByTableName.gen.ts'),
    data: titlesByTableName,
    satisfiesType: 'Record<string, string>',
  })
  await writeTsModule({
    filePath: path.resolve(outputRoot, 'inspectorAttributes.gen.ts'),
    data: sortRecordByKey(inspectorAttributes),
    typeImport: "import type { TopicDocInspectorAttributes } from '../../topicDocs/inspector'",
    satisfiesType: 'TopicDocInspectorAttributes',
  })
  await writeTsModule({
    filePath: path.resolve(outputRoot, 'inspectorTranslations.gen.ts'),
    data: sortRecordByKey(inspectorTranslations),
    satisfiesType: 'Record<string, string>',
  })
  await writeTsModule({
    filePath: path.resolve(outputRoot, 'inspectorDescriptions.gen.ts'),
    data: sortRecordByKey(inspectorDescriptions),
    satisfiesType:
      'Record<string, { keys: Record<string, string>; values: Record<string, Record<string, string>> }>',
  })

  console.log(`Built topic docs for ${Object.keys(byTableName).length} table(s).`)
}

if (import.meta.main) {
  await main()
}
