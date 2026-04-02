#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

type ManifestVariable = {
  name: string
  required?: boolean
  sensitive?: boolean
  defaultValue?: string
  githubSource: string
  description: string
}

type Manifest = {
  variables: ManifestVariable[]
}

const START_MARKER = '<!-- GENERATED_ENV_TABLE_START -->'
const END_MARKER = '<!-- GENERATED_ENV_TABLE_END -->'
const MANIFEST_PATH = resolve(import.meta.dir, '..', 'env', 'deploy.manifest.json')
const README_PATH = resolve(import.meta.dir, '..', 'README.md')

function readManifest(path: string) {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as Manifest
  if (!Array.isArray(parsed.variables))
    throw new Error(`Manifest must contain variables array: ${path}`)
  return parsed.variables
}

function markdownEscape(text: string) {
  return text.replaceAll('|', '\\|')
}

function buildGeneratedBlock(vars: ManifestVariable[]) {
  const rows = vars.map((v) => {
    const required = v.required ? 'yes' : 'no'
    const notes = [
      v.description,
      v.defaultValue !== undefined ? `Default: \`${v.defaultValue}\`.` : '',
      v.sensitive ? 'Sensitive.' : '',
    ]
      .filter(Boolean)
      .join(' ')
    return `| \`${v.name}\` | \`${v.githubSource}\` | ${required} | ${markdownEscape(notes)} |`
  })

  return [
    START_MARKER,
    '<!-- This block is GENERATED. Edit .github/env/deploy.manifest.json and run `bun .github/scripts/generate-github-readme.ts`. -->',
    '| Name | Source | Required | Description |',
    '| --- | --- | --- | --- |',
    ...rows,
    END_MARKER,
  ].join('\n')
}

function main() {
  const variables = readManifest(MANIFEST_PATH)
  const generatedBlock = buildGeneratedBlock(variables)
  const readme = readFileSync(README_PATH, 'utf8')

  if (!readme.includes(START_MARKER) || !readme.includes(END_MARKER)) {
    throw new Error(`README is missing generation markers: ${START_MARKER} / ${END_MARKER}`)
  }

  const start = readme.indexOf(START_MARKER)
  const end = readme.indexOf(END_MARKER)
  const before = readme.slice(0, start).trimEnd()
  const after = readme.slice(end + END_MARKER.length).trimStart()
  const updated = `${before}\n\n${generatedBlock}\n\n${after}\n`
  writeFileSync(README_PATH, updated, 'utf8')
  process.stdout.write(`Updated ${README_PATH}\n`)
}

main()
