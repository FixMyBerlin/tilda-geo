import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { topicDocsChapterFrontMatterSchema } from '../../src/data/topicDocs/schema'
import { readText } from './io'
import type { CompiledChapter } from './types'

const stripOrderingPrefix = (value: string) => value.replace(/^\d+[._ -]+/, '')

const toChapterId = (fileName: string) =>
  stripOrderingPrefix(fileName.replace(/\.[^.]+$/, ''))
    .trim()
    .toLowerCase()
    .replaceAll('_', '-')
    .replaceAll(' ', '-')

/** Chapter id / sort order come from the filename; title must be in YAML front matter. */
const CHAPTER_FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/

const splitChapterMarkdown = (raw: string, chapterPath: string) => {
  const text = raw.replace(/^\uFEFF/, '')
  const match = text.match(CHAPTER_FRONT_MATTER)
  if (!match) {
    throw new Error(
      `Chapter must start with YAML front matter (--- … ---) including title: ${chapterPath}`,
    )
  }
  const yamlBlock = match[1]
  const markdownBody = match[2] ?? ''
  if (yamlBlock === undefined) {
    throw new Error(`Malformed chapter front matter in ${chapterPath}`)
  }
  const parsed = Bun.YAML.parse(yamlBlock) as unknown
  const frontMatter = topicDocsChapterFrontMatterSchema.safeParse(parsed)
  if (!frontMatter.success) {
    throw new Error(`Invalid chapter front matter in ${chapterPath}: ${frontMatter.error.message}`)
  }
  return { title: frontMatter.data.title, markdownBody: markdownBody.trimStart() }
}

export const compileChapters = async (topicDir: string) => {
  const chaptersDir = path.resolve(topicDir, 'chapters')
  if (!existsSync(chaptersDir)) return []

  const chapterFiles = (await readdir(chaptersDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))

  const compiled: Array<CompiledChapter> = []
  for (const chapterFile of chapterFiles) {
    const chapterPath = path.resolve(chaptersDir, chapterFile)
    const markdownRaw = await readText(chapterPath)
    const { title, markdownBody } = splitChapterMarkdown(markdownRaw, chapterPath)
    compiled.push({
      id: toChapterId(chapterFile),
      title,
      markdown: markdownBody,
    })
  }
  return compiled
}
