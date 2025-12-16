/**
 * Splits a string by semicolons, but respects semicolons inside parentheses.
 * Only handles one level of parentheses (no nesting).
 *
 * Examples:
 * - "foo;bar;bz" → ["foo", "bar", "bz"]
 * - "foo (a; b; c)" → ["foo (a; b; c)"]
 * - "foo;bar (A; B; C);bz" → ["foo", "bar (A; B; C)", "bz"]
 */
export function splitSemicolonRespectingBrackets(input: string): string[] {
  if (!input) return []

  const segments = input.match(/[^;]*\([^)]*\)[^;]*|[^;]+/g) || []

  return segments.map((s) => s.trim()).filter(Boolean)
}
