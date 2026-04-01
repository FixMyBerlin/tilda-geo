import picomatch from 'picomatch'

/**
 * Returns true if the folder should be ignored.
 * Patterns are gitignore-style: globs to ignore; leading `!` means exception (do not ignore).
 * See .updateignore in the geojson folder for the file format.
 */
export function ignoreFolder(regionAndDatasetFolder: string, ignorePatterns: string[]) {
  const positivePatterns = ignorePatterns.filter((p) => !p.startsWith('!'))
  const negationPatterns = ignorePatterns.filter((p) => p.startsWith('!')).map((p) => p.slice(1))

  if (positivePatterns.length === 0) return false

  const isMatch = picomatch(positivePatterns, { ignore: negationPatterns })
  return isMatch(regionAndDatasetFolder)
}
