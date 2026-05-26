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
import type { CompiledTopicDoc, InspectorDescriptions } from './types'

const sortStringRecordByKey = (map: Record<string, string>) =>
  Object.fromEntries([...Object.entries(map)].sort(([a], [b]) => a.localeCompare(b, 'en')))

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
      })
    }
  }

  await rm(outputRoot, { recursive: true, force: true })
  await mkdir(outputRoot, { recursive: true })

  const sortedInspectorTranslations = sortStringRecordByKey(inspectorTranslations)
  await writeTsModule({
    filePath: path.resolve(outputRoot, 'byTableName.gen.ts'),
    data: byTableName,
    typeImport: "import type { TopicDocCompiled } from '../../topicDocs/runtime'",
    satisfiesType: 'Partial<Record<string, TopicDocCompiled>>',
  })
  await writeTsModule({
    filePath: path.resolve(outputRoot, 'masterportalByTableName.gen.ts'),
    data: masterportalByTableName,
    typeImport:
      "import type { TopicDocMasterportalGfiConfig } from '../../topicDocs/masterportalGfi.types'",
    satisfiesType: 'Partial<Record<string, TopicDocMasterportalGfiConfig>>',
  })
  await writeTsModule({
    filePath: path.resolve(outputRoot, 'inspectorTranslations.gen.ts'),
    data: sortedInspectorTranslations,
    satisfiesType: 'Record<string, string>',
  })
  await writeTsModule({
    filePath: path.resolve(outputRoot, 'inspectorDescriptions.gen.ts'),
    data: inspectorDescriptions,
    satisfiesType:
      'Record<string, { keys: Record<string, string>; values: Record<string, Record<string, string>> }>',
  })

  console.log(`Built topic docs for ${Object.keys(byTableName).length} table(s).`)
}

if (import.meta.main) {
  await main()
}
