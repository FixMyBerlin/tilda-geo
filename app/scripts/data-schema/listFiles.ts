export async function listFilesByEnding(
  cwd: string,
  endings: readonly string[],
  globPattern = '*',
) {
  const files: string[] = []
  const lowered = endings.map((ending) => ending.toLowerCase())
  try {
    for await (const match of new Bun.Glob(globPattern).scan({
      cwd,
      onlyFiles: true,
      followSymlinks: true,
    })) {
      const lower = match.toLowerCase()
      if (lowered.some((ending) => lower.endsWith(ending))) files.push(match)
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return []
    throw error
  }
  return files
}
