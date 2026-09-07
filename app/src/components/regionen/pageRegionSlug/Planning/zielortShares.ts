import {
  DEFAULT_ZIELORT_SHARES,
  ZIELORT_CATEGORY_KEYS,
  type ZielortCategory,
} from './zielortCategories'

export type ZielortShares = Record<ZielortCategory, number>

/** Summe aller vier Kategorie-Anteile — sie bleibt immer 100 (siehe `rebalanceZielortShares`). */
export const ZIELORT_SHARE_TOTAL = 100

/** Schrittweite des Reglers; die übrigen drei Kategorien landen beim Ausgleich auf ganzen Prozent. */
export const ZIELORT_SHARE_STEP = 5

/**
 * Liest die Anteile aus einer gespeicherten Config. Fehlende oder kaputte Werte (alte Varianten,
 * die das Feld noch nicht kennen) fallen auf die Gleichverteilung zurück — genau der Stand, mit
 * dem der Faktor sich verhält wie vor der Kategorie-Gewichtung.
 */
export const readZielortShares = (
  stored: Partial<Record<string, number>> | undefined | null,
): ZielortShares => {
  if (!stored) return { ...DEFAULT_ZIELORT_SHARES }
  const values: number[] = []
  for (const key of ZIELORT_CATEGORY_KEYS) {
    const value = stored[key]
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      return { ...DEFAULT_ZIELORT_SHARES }
    }
    values.push(value)
  }
  const total = values.reduce((sum, value) => sum + value, 0)
  if (total <= 0) return { ...DEFAULT_ZIELORT_SHARES }
  // Auf 100 normieren: gespeicherte Altstände könnten durch Rundung leicht daneben liegen.
  return distribute(values.map((value) => (value / total) * ZIELORT_SHARE_TOTAL))
}

/**
 * Rundet vier Roh-Anteile so auf ganze Prozent, dass ihre Summe exakt 100 ergibt
 * (Largest-Remainder: die Kategorien mit dem größten abgeschnittenen Rest bekommen den Rest).
 */
const distribute = (raw: number[]): ZielortShares => {
  const floors = raw.map((value) => Math.floor(value))
  let remainder = ZIELORT_SHARE_TOTAL - floors.reduce((sum, value) => sum + value, 0)
  const order = raw
    .map((value, index) => ({ index, rest: value - Math.floor(value) }))
    .sort((a, b) => b.rest - a.rest || a.index - b.index)
  for (const { index } of order) {
    if (remainder <= 0) break
    floors[index] = floors[index]! + 1
    remainder -= 1
  }
  return Object.fromEntries(
    ZIELORT_CATEGORY_KEYS.map((key, index) => [key, floors[index]!]),
  ) as ZielortShares
}

/**
 * Setzt eine Kategorie auf `nextValue` und verteilt den Rest auf die übrigen drei — proportional
 * zu deren bisherigem Verhältnis, damit sich beim Ziehen eines Reglers nur der eingestellte Wert
 * gezielt ändert und die anderen ihr Verhältnis untereinander behalten. Stehen die anderen alle
 * auf 0, wird gleichmäßig verteilt (sonst bliebe die Summe unter 100 hängen).
 */
export const rebalanceZielortShares = (
  shares: ZielortShares,
  changed: ZielortCategory,
  nextValue: number,
): ZielortShares => {
  const value = Math.min(ZIELORT_SHARE_TOTAL, Math.max(0, Math.round(nextValue)))
  const others = ZIELORT_CATEGORY_KEYS.filter((key) => key !== changed)
  const othersTotal = others.reduce((sum, key) => sum + shares[key], 0)
  const rest = ZIELORT_SHARE_TOTAL - value
  const raw = ZIELORT_CATEGORY_KEYS.map((key) => {
    if (key === changed) return value
    return othersTotal > 0 ? (shares[key] / othersTotal) * rest : rest / others.length
  })
  const balanced = distribute(raw)
  // Der eingestellte Wert ist gesetzt, nicht gerundet — die Rundungsdifferenz tragen die anderen.
  if (balanced[changed] !== value) {
    const diff = balanced[changed] - value
    balanced[changed] = value
    const target = others.reduce((a, b) => (balanced[a] >= balanced[b] ? a : b))
    balanced[target] += diff
  }
  return balanced
}

/**
 * Faktor, um den der Zuschlag einer einzelnen Kategorie gegenüber dem vollen Zuschlag gedämpft
 * ist — dieselbe Normierung wie im Worker (`scorer.py`): der größte Anteil steht für 100 %, ein
 * halb so großer Anteil für 50 %. Bei Gleichverteilung ist jede Kategorie also voll wirksam.
 */
export const zielortCategoryEffect = (shares: ZielortShares, category: ZielortCategory) => {
  const max = Math.max(...ZIELORT_CATEGORY_KEYS.map((key) => shares[key]))
  return max > 0 ? shares[category] / max : 0
}
