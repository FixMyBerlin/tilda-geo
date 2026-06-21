import { x } from 'tinyexec'

export type ShellResult = {
  exitCode: number
  stdout: string
  stderr: string
  /** Bun-compatible: returns the captured stdout as a string. */
  text(): string
}

/**
 * Parse a Bun-`$`-style template into `[command, ...args]`, matching Bun/execa semantics:
 * - whitespace in the literal parts separates arguments;
 * - each interpolated value becomes a single argument (it is NOT word-split), concatenated to any
 *   adjacent non-whitespace literal (so `--file=${p}` and `${dir}:/dump` stay one argument);
 * - an interpolated array expands to one argument per element.
 *
 * This is the small piece tinyexec doesn't provide (it takes an explicit command + args array),
 * and is what lets every call site keep Bun's ergonomic `` $`cmd ${arg}` `` form.
 */
function tokenize(strings: TemplateStringsArray, values: readonly unknown[]): string[] {
  const tokens: string[] = []
  let current = ''
  let hasCurrent = false
  const flush = () => {
    if (hasCurrent) {
      tokens.push(current)
      current = ''
      hasCurrent = false
    }
  }
  const append = (s: string) => {
    current += s
    hasCurrent = true
  }

  for (let i = 0; i < strings.length; i++) {
    const lit = strings[i] ?? ''
    let j = 0
    while (j < lit.length) {
      if (/\s/.test(lit[j]!)) {
        flush()
        while (j < lit.length && /\s/.test(lit[j]!)) j++
      } else {
        const start = j
        while (j < lit.length && !/\s/.test(lit[j]!)) j++
        append(lit.slice(start, j))
      }
    }
    if (i < values.length) {
      const value = values[i]
      if (Array.isArray(value)) {
        flush()
        for (const element of value) tokens.push(String(element))
      } else {
        append(String(value))
      }
    }
  }
  flush()
  return tokens
}

/**
 * A Bun `$`-compatible shell tag, backed by {@link https://github.com/tinylibs/tinyexec tinyexec}
 * (a zero-dependency wrapper over `node:child_process`, the
 * {@link https://github.com/e18e/module-replacements e18e}-recommended replacement for execa).
 *
 * Drop-in for `import { $ } from 'bun'`:
 *
 * ```ts
 * await $`cmd ${arg}`                                  // streams to the terminal, throws on non-zero
 * const out = await $`cmd`.text()                      // captured stdout as a string
 * const r = await $`cmd`.quiet().nothrow()             // r.exitCode / r.stdout / r.stderr / r.text()
 * await $`cmd`.cwd(dir).env({ FOO: 'bar' })
 * ```
 *
 * Behaviour vs. Bun:
 * - Streams stdout/stderr to the terminal by default; `.quiet()` and `.text()` capture instead.
 * - Throws on a non-zero exit code (like Bun); `.nothrow()` resolves with the failed result.
 * - Interpolations are passed as individual, escaped arguments (no embedded shell — same safety
 *   model as Bun's `$`). The one command that needed a pipe was rewritten in plain Node.
 */
class ShellPromise implements PromiseLike<ShellResult> {
  readonly #strings: TemplateStringsArray
  readonly #values: readonly unknown[]
  #quiet = false
  #captureText = false
  #reject = true
  #cwd: string | undefined
  #env: Record<string, string | undefined> | undefined

  constructor(strings: TemplateStringsArray, values: readonly unknown[]) {
    this.#strings = strings
    this.#values = values
  }

  quiet(): this {
    this.#quiet = true
    return this
  }

  nothrow(): this {
    this.#reject = false
    return this
  }

  cwd(dir: string): this {
    this.#cwd = dir
    return this
  }

  env(env: Record<string, string | undefined>): this {
    this.#env = { ...process.env, ...env }
    return this
  }

  async text(): Promise<string> {
    this.#captureText = true
    return (await this.#exec()).stdout
  }

  // oxlint-disable-next-line unicorn/no-thenable -- intentional: a Bun `$`-compatible thenable
  then<TResult1 = ShellResult, TResult2 = never>(
    onfulfilled?: ((value: ShellResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.#exec().then(onfulfilled, onrejected)
  }

  async #exec(): Promise<ShellResult> {
    const [command, ...args] = tokenize(this.#strings, this.#values)
    if (!command) throw new Error('Empty shell command')

    // Capture (pipe) when output is consumed; otherwise stream to the terminal like Bun's default.
    const capture = this.#quiet || this.#captureText
    const result = await x(command, args, {
      throwOnError: false, // we throw ourselves so the error carries stdout/stderr/exitCode
      nodeOptions: {
        cwd: this.#cwd,
        env: this.#env as NodeJS.ProcessEnv | undefined,
        // tinyexec's default pipes (captures) stdout/stderr; `inherit` streams to the terminal.
        ...(capture ? {} : { stdio: 'inherit' as const }),
      },
    })

    const stdout = result.stdout ?? ''
    const stderr = result.stderr ?? ''
    const exitCode = result.exitCode ?? 1
    const shellResult: ShellResult = { exitCode, stdout, stderr, text: () => stdout }

    if (this.#reject && exitCode !== 0) {
      const error = new Error(
        `Command failed with exit code ${exitCode}: ${command} ${args.join(' ')}`,
      ) as Error & ShellResult
      Object.assign(error, shellResult)
      throw error
    }
    return shellResult
  }
}

/** Bun `$`-compatible tagged template. See {@link ShellPromise}. */
export function $(strings: TemplateStringsArray, ...values: unknown[]): ShellPromise {
  return new ShellPromise(strings, values)
}
