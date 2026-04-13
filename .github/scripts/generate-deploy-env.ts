#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { appHostSchema } from '../../app/src/components/shared/utils/getAppBaseUrl'
import { cachelessHostSchema } from '../../app/src/components/shared/utils/getCachelessTilesUrl'
import { tilesHostSchema } from '../../app/src/components/shared/utils/getTilesUrl'

type ManifestVariable = {
  name: string
  sourceEnv: string
  required?: boolean
  defaultValue?: string
}

type Manifest = {
  variables: ManifestVariable[]
}

function parseArgs(argv: string[]) {
  const args = new Map<string, string>()
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i]
    const value = argv[i + 1]
    if (!key.startsWith('--')) throw new Error(`Invalid argument: ${key}`)
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${key}`)
    args.set(key.slice(2), value)
    i += 1
  }
  return args
}

function shellQuote(value: string) {
  return `'${String(value).replaceAll("'", "'\\''")}'`
}

function readManifest(path: string) {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as Manifest
  if (!Array.isArray(parsed.variables)) {
    throw new Error(`Manifest must contain "variables" array: ${path}`)
  }
  return parsed.variables
}

function resolveValue(entry: ManifestVariable) {
  const raw = process.env[entry.sourceEnv]
  if (raw !== undefined && raw !== '') return raw
  if (entry.defaultValue !== undefined) return entry.defaultValue
  if (entry.required) {
    throw new Error(
      `Missing required value for ${entry.name} (expected process.env.${entry.sourceEnv})`,
    )
  }
  return ''
}

function validateInfraHostEnvValue({ name, value }: { name: string; value: string }) {
  if (name === 'APP_URL') appHostSchema.parse(value)
  if (name === 'TILES_URL') tilesHostSchema.parse(value)
  if (name === 'CACHELESS_URL') cachelessHostSchema.parse(value)
}

function main() {
  const args = parseArgs(process.argv)
  const manifestArg = args.get('manifest')
  const outputArg = args.get('output')
  if (!manifestArg || !outputArg) {
    throw new Error(
      'Usage: bun .github/scripts/generate-deploy-env.ts --manifest <path> --output <path>',
    )
  }

  const manifestPath = resolve(manifestArg)
  const outputPath = resolve(outputArg)
  const manifest = readManifest(manifestPath)

  const seen = new Set<string>()
  const lines: string[] = []
  const missing: string[] = []

  for (const entry of manifest) {
    if (!entry.name || !entry.sourceEnv) {
      throw new Error(`Each manifest entry needs name + sourceEnv: ${JSON.stringify(entry)}`)
    }
    if (seen.has(entry.name)) throw new Error(`Duplicate variable in manifest: ${entry.name}`)
    seen.add(entry.name)
    try {
      const value = resolveValue(entry)
      validateInfraHostEnvValue({ name: entry.name, value })
      lines.push(`${entry.name}=${shellQuote(value)}`)
    } catch (error) {
      missing.push(error instanceof Error ? error.message : String(error))
    }
  }

  if (missing.length) {
    throw new Error(`Cannot generate deploy env file:\n- ${missing.join('\n- ')}`)
  }

  writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8')
  process.stdout.write(`Wrote ${lines.length} variables to ${outputPath}\n`)
}

main()
