import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  type TopicDocsYaml,
  topicDocsGroupsYamlSchema,
  topicDocsYamlSchema,
} from '../../src/data/topicDocs/schema'
import { inputRoot } from './paths'

export const readText = async (filePath: string) => readFile(filePath, 'utf-8')

export const writeJson = async (filePath: string, data: unknown) => {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`)
}

const ensureDir = async (dirPath: string) => {
  if (!existsSync(dirPath)) {
    throw new Error(`Missing folder: ${dirPath}`)
  }
}

export const readTopicYamlFiles = async () => {
  await ensureDir(inputRoot)
  const topLevel = await readdir(inputRoot, { withFileTypes: true })
  const files: Array<string> = []
  for (const entry of topLevel) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue
    const dirPath = path.resolve(inputRoot, entry.name)
    const children = await readdir(dirPath, { withFileTypes: true })
    for (const child of children) {
      if (!child.isFile()) continue
      if (child.name === 'groups.yaml' || child.name === 'groups.yml') continue
      if (child.name.endsWith('.yaml') || child.name.endsWith('.yml')) {
        files.push(path.resolve(dirPath, child.name))
      }
    }
  }
  return files
}

export const parseTopicYaml = async (filePath: string) => {
  const raw = await readText(filePath)
  const parsed = Bun.YAML.parse(raw) as unknown
  if (Array.isArray(parsed)) {
    throw new Error(`Expected single YAML document in ${filePath}`)
  }
  const data = topicDocsYamlSchema.parse(parsed)
  return { filePath, data }
}

export const readGroupsYaml = async () => {
  const yamlPath = path.resolve(inputRoot, 'groups.yaml')
  const ymlPath = path.resolve(inputRoot, 'groups.yml')
  const groupsPath = existsSync(yamlPath) ? yamlPath : ymlPath
  if (!existsSync(groupsPath)) {
    return null
  }
  const raw = await readText(groupsPath)
  const parsed = Bun.YAML.parse(raw) as unknown
  if (Array.isArray(parsed)) {
    throw new Error(`Expected single YAML document in ${groupsPath}`)
  }
  const data = topicDocsGroupsYamlSchema.parse(parsed)
  return data
}

export const tableNameFromYamlPath = (filePath: string) =>
  path.basename(filePath).replace(/\.(ya?ml)$/i, '')

export const docsByTableNameFromParsed = (
  parsedDocs: Array<{ filePath: string; data: TopicDocsYaml }>,
) =>
  new Map<string, TopicDocsYaml>(
    parsedDocs.map((parsedDoc) => [tableNameFromYamlPath(parsedDoc.filePath), parsedDoc.data]),
  )
