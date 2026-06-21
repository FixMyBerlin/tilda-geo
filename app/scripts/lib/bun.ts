import { Buffer } from 'node:buffer'
/**
 * Compatibility shims for the handful of Bun runtime APIs our scripts used, reimplemented on
 * stock Node (run via nub). Import the named helpers and drop the `Bun.` prefix, e.g.:
 *
 *   import { $ } from 'bun'                 →  import { $, write, file } from '../lib/bun'
 *   Bun.write(path, data)                  →  write(path, data)
 *   Bun.file(path).text()                  →  file(path).text()
 *   Bun.argv                               →  argv
 *   Bun.YAML.parse(raw)                    →  YAML.parse(raw)
 *   Bun.spawn([...]) / Bun.spawnSync([...])→  spawn([...]) / spawnSync([...])
 */
import { spawn as nodeSpawn, spawnSync as nodeSpawnSync } from 'node:child_process'
import { existsSync, statSync, type Stats } from 'node:fs'
import { mkdir, readFile, stat as fsStat, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { Readable } from 'node:stream'
import { parse as parseYaml } from 'yaml'

export { $, type ShellResult } from './sh'

/** `Bun.argv` → Node's `process.argv` (both are `[runtime, script, ...args]`). */
export const argv = process.argv

/** `Bun.YAML` → backed by the `yaml` package. */
export const YAML = {
  parse: (text: string): unknown => parseYaml(text),
}

export type BunFile = {
  readonly name: string
  readonly size: number
  text(): Promise<string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches Bun's `BunFile.json(): Promise<any>`
  json(): Promise<any>
  bytes(): Promise<Uint8Array>
  arrayBuffer(): Promise<ArrayBuffer>
  exists(): Promise<boolean>
  stat(): Promise<Stats>
}

/** `Bun.file(path)` → a minimal lazy file handle backed by `node:fs`. */
export function file(path: string): BunFile {
  return {
    name: path,
    get size() {
      try {
        return statSync(path).size
      } catch {
        return 0
      }
    },
    async text() {
      return readFile(path, 'utf8')
    },
    async json() {
      return JSON.parse(await readFile(path, 'utf8'))
    },
    async bytes() {
      return new Uint8Array(await readFile(path))
    },
    async arrayBuffer() {
      const buf = await readFile(path)
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
    },
    async exists() {
      return existsSync(path)
    },
    async stat() {
      return fsStat(path)
    },
  }
}

type WriteData = string | ArrayBufferView | ArrayBuffer | BunFile

/** `Bun.write(dest, data)` → writes via `node:fs`, creating parent dirs like Bun does. */
export async function write(dest: string | BunFile, data: WriteData): Promise<number> {
  const path = typeof dest === 'string' ? dest : dest.name
  await mkdir(dirname(path), { recursive: true })

  let payload: string | Uint8Array
  if (typeof data === 'string') {
    payload = data
  } else if (data instanceof ArrayBuffer) {
    payload = new Uint8Array(data)
  } else if (ArrayBuffer.isView(data)) {
    payload = new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  } else {
    payload = await data.text()
  }

  await writeFile(path, payload)
  return typeof payload === 'string' ? Buffer.byteLength(payload) : payload.byteLength
}

type StdioOption = 'pipe' | 'inherit' | 'ignore'

/** `Bun.spawn`/`Bun.spawnSync` `onExit` callback (the `proc` argument is unused here). */
type OnExit = (
  proc: undefined,
  exitCode: number | null,
  signalCode: NodeJS.Signals | null,
  error: Error | undefined,
) => void

type SpawnOptions = {
  cwd?: string
  env?: Record<string, string | undefined>
  stdin?: StdioOption
  stdout?: StdioOption
  stderr?: StdioOption
  onExit?: OnExit
}

export type Subprocess = {
  stdout: ReadableStream<Uint8Array>
  stderr: ReadableStream<Uint8Array>
  readonly exited: Promise<number>
  readonly exitCode: number | null
}

function toWeb(stream: Readable | null): ReadableStream<Uint8Array> {
  if (!stream) return new ReadableStream<Uint8Array>({ start: (c) => c.close() })
  return Readable.toWeb(stream) as unknown as ReadableStream<Uint8Array>
}

/**
 * `Bun.spawn([cmd, ...args], opts)` → a Node child process exposing Bun's
 * `{ stdout, stderr, exited, exitCode }` surface (web `ReadableStream`s, so
 * `new Response(proc.stdout).text()` keeps working). Stdio defaults match Bun:
 * stdin `ignore`, stdout `pipe`, stderr `inherit`.
 */
export function spawn(cmd: string[], options: SpawnOptions = {}): Subprocess {
  const child = nodeSpawn(cmd[0]!, cmd.slice(1), {
    cwd: options.cwd,
    env: options.env ? { ...process.env, ...options.env } : process.env,
    stdio: [options.stdin ?? 'ignore', options.stdout ?? 'pipe', options.stderr ?? 'inherit'],
  })
  const exited = new Promise<number>((resolve) => {
    child.on('close', (code, signal) => {
      options.onExit?.(undefined, code, signal, undefined)
      resolve(code ?? 0)
    })
    child.on('error', (error) => {
      options.onExit?.(undefined, null, null, error)
      resolve(1)
    })
  })
  return {
    stdout: toWeb(child.stdout),
    stderr: toWeb(child.stderr),
    exited,
    get exitCode() {
      return child.exitCode
    },
  }
}

export type SyncSubprocess = {
  stdout: Buffer
  stderr: Buffer
  exitCode: number
  success: boolean
}

/**
 * `Bun.spawnSync([cmd, ...args], opts)` → Node `spawnSync` with a Bun-ish result shape.
 * Stdio defaults match Bun: stdin `ignore`, stdout `pipe`, stderr `inherit`.
 */
export function spawnSync(cmd: string[], options: SpawnOptions = {}): SyncSubprocess {
  const res = nodeSpawnSync(cmd[0]!, cmd.slice(1), {
    cwd: options.cwd,
    env: options.env ? { ...process.env, ...options.env } : process.env,
    stdio: [options.stdin ?? 'ignore', options.stdout ?? 'pipe', options.stderr ?? 'inherit'],
  })
  const exitCode = res.status ?? 1
  options.onExit?.(undefined, res.status, res.signal, res.error ?? undefined)
  return {
    stdout: res.stdout ?? Buffer.alloc(0),
    stderr: res.stderr ?? Buffer.alloc(0),
    exitCode,
    success: exitCode === 0,
  }
}
