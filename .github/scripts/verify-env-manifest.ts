#!/usr/bin/env bun

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

type ManifestVariable = {
  name: string
  sourceEnv: string
  githubSource?: string
  description?: string
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

function readManifest(path: string) {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as Manifest
  if (!Array.isArray(parsed.variables))
    throw new Error(`Manifest must contain variables array: ${path}`)
  return parsed.variables
}

function parseEnvExampleKeys(path: string) {
  const content = readFileSync(path, 'utf8')
  const matches = [...content.matchAll(/^\s*#?\s*([A-Z0-9_]+)=/gm)]
  return new Set(matches.map((match) => match[1]))
}

function parseComposeRefs(path: string) {
  const content = readFileSync(path, 'utf8')
  const interpolation = new Set(
    [...content.matchAll(/\$\{([A-Z0-9_]+)\}/g)].map((match) => match[1]),
  )
  const passThrough = new Set(
    [...content.matchAll(/^\s{6}([A-Z0-9_]+):\s*$/gm)].map((match) => match[1]),
  )
  return new Set([...interpolation, ...passThrough])
}

function parseSetupEnvMappings(path: string) {
  const content = readFileSync(path, 'utf8')
  const startMarker = '- name: Generate deploy .env from manifest'
  const startIndex = content.indexOf(startMarker)
  if (startIndex === -1) {
    throw new Error(`Could not find "${startMarker}" in ${path}`)
  }
  const afterStart = content.slice(startIndex)
  const envMarker = '\n        env:\n'
  const envIndex = afterStart.indexOf(envMarker)
  if (envIndex === -1) {
    throw new Error(`Could not find env block for "${startMarker}" in ${path}`)
  }

  const envBlockStart = envIndex + envMarker.length
  const envBlockRaw = afterStart.slice(envBlockStart)
  const envBlockEnd = envBlockRaw.indexOf('\n        run:')
  if (envBlockEnd === -1) {
    throw new Error(`Could not find run block after env block for "${startMarker}" in ${path}`)
  }
  const envBlock = envBlockRaw.slice(0, envBlockEnd)
  const keys = [...envBlock.matchAll(/^\s{10}([A-Z0-9_]+):\s+\$\{\{.+\}\}\s*$/gm)].map(
    (match) => match[1],
  )
  return new Set(keys)
}

const ALLOWED_EXTRA_COMPOSE_VARS = new Set([
  'PGHOST',
  'PGDATABASE',
  'PGUSER',
  'PGPASSWORD',
  'WAIT_FOR_FRESH_DATA',
  'SKIP_WARM_CACHE',
  'PROCESS_ONLY_TOPICS',
  'PROCESS_ONLY_BBOX',
  'OSM2PGSQL_LOG_LEVEL',
  'OSM2PGSQL_NUMBER_PROCESSES',
  'ID_FILTER',
  'FORCE_COLOR',
  'DATABASE_URL',
  'POSTGRES_USER',
  'POSTGRES_DB',
  'POSTGRES_PASSWORD',
])

function main() {
  const args = parseArgs(process.argv)
  const manifestArg = args.get('manifest')
  const envExampleArg = args.get('env-example')
  const composeArg = args.get('docker-compose')
  const setupWorkflowArg = args.get('setup-workflow')
  if (!manifestArg || !envExampleArg || !composeArg || !setupWorkflowArg) {
    throw new Error(
      'Usage: bun .github/scripts/verify-env-manifest.ts --manifest <path> --env-example <path> --docker-compose <path> --setup-workflow <path>',
    )
  }

  const manifest = readManifest(resolve(manifestArg))
  const envExampleKeys = parseEnvExampleKeys(resolve(envExampleArg))
  const composeRefs = parseComposeRefs(resolve(composeArg))
  const workflowMappings = parseSetupEnvMappings(resolve(setupWorkflowArg))

  const names = new Set<string>()
  const missingInEnvExample: string[] = []
  const missingInCompose: string[] = []
  const missingInWorkflow: string[] = []

  for (const entry of manifest) {
    if (!entry.name || !entry.sourceEnv) {
      throw new Error(`Each manifest entry needs name + sourceEnv: ${JSON.stringify(entry)}`)
    }
    if (names.has(entry.name)) throw new Error(`Duplicate variable in manifest: ${entry.name}`)
    names.add(entry.name)

    if (!entry.githubSource || !entry.description) {
      throw new Error(`Manifest entry missing githubSource/description: ${entry.name}`)
    }
    if (!envExampleKeys.has(entry.name)) missingInEnvExample.push(entry.name)
    if (!composeRefs.has(entry.name)) missingInCompose.push(entry.name)
    if (!workflowMappings.has(entry.sourceEnv)) missingInWorkflow.push(entry.sourceEnv)
  }

  const unmanagedInCompose = [...composeRefs]
    .filter((name) => !names.has(name))
    .filter((name) => !ALLOWED_EXTRA_COMPOSE_VARS.has(name))
    .sort()
  const unmanagedInWorkflow = [...workflowMappings]
    .filter((name) => !manifest.some((entry) => entry.sourceEnv === name))
    .sort()

  if (
    missingInEnvExample.length ||
    missingInCompose.length ||
    missingInWorkflow.length ||
    unmanagedInCompose.length ||
    unmanagedInWorkflow.length
  ) {
    const lines: string[] = ['Manifest verification failed:']
    if (missingInEnvExample.length) {
      lines.push(`- Missing in .env.example: ${missingInEnvExample.sort().join(', ')}`)
    }
    if (missingInCompose.length) {
      lines.push(`- Missing in docker-compose.yml: ${missingInCompose.sort().join(', ')}`)
    }
    if (missingInWorkflow.length) {
      lines.push(
        `- Missing source mappings in setup-env workflow: ${missingInWorkflow.sort().join(', ')}`,
      )
    }
    if (unmanagedInCompose.length) {
      lines.push(`- Unmanaged vars in docker-compose.yml: ${unmanagedInCompose.join(', ')}`)
    }
    if (unmanagedInWorkflow.length) {
      lines.push(
        `- Unmanaged source mappings in setup-env workflow: ${unmanagedInWorkflow.join(', ')}`,
      )
    }
    throw new Error(lines.join('\n'))
  }

  process.stdout.write(
    `Manifest verification passed (${manifest.length} manifest keys; .env.example, docker-compose.yml, and setup-env workflow are consistent).\n`,
  )
}

main()
