/**
 * Generischer Algorithmus hinter allen „Kategorie-Aufteilung eines Faktors"-Reglern
 * (Zielorte: 4 Kategorien, ÖPNV: 2) — Summe der Anteile bleibt immer 100 %, ein Regler ziehen
 * verteilt den Rest proportional auf die übrigen. `zielortShares.ts`/`oepnvShares.ts` binden das
 * jeweils an ihre konkreten Kategorien/Defaults; hier steht nur die Rechenlogik, einmal.
 */
export type CategoryShares<K extends string> = Record<K, number>

/** Summe aller Kategorie-Anteile — bleibt immer 100 (siehe `rebalanceCategoryShares`). */
export const CATEGORY_SHARE_TOTAL = 100

/** Schrittweite der Regler. */
export const CATEGORY_SHARE_STEP = 5

/**
 * Liest die Anteile aus einer gespeicherten Config. Fehlende oder kaputte Werte (alte Varianten,
 * die das Feld noch nicht kennen) fallen auf `defaults` zurück.
 */
export const readCategoryShares = <K extends string>(
  keys: readonly K[],
  defaults: CategoryShares<K>,
  stored: Partial<Record<string, number>> | undefined | null,
): CategoryShares<K> => {
  if (!stored) return { ...defaults }
  const values: number[] = []
  for (const key of keys) {
    const value = stored[key]
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      return { ...defaults }
    }
    values.push(value)
  }
  const total = values.reduce((sum, value) => sum + value, 0)
  if (total <= 0) return { ...defaults }
  // Auf 100 normieren: gespeicherte Altstände könnten durch Rundung leicht daneben liegen.
  return distribute(
    keys,
    values.map((value) => (value / total) * CATEGORY_SHARE_TOTAL),
  )
}

/**
 * Rundet Roh-Anteile so auf ganze Prozent, dass ihre Summe exakt 100 ergibt (Largest-Remainder:
 * die Kategorien mit dem größten abgeschnittenen Rest bekommen den Rest).
 */
const distribute = <K extends string>(keys: readonly K[], raw: number[]): CategoryShares<K> => {
  const floors = raw.map((value) => Math.floor(value))
  let remainder = CATEGORY_SHARE_TOTAL - floors.reduce((sum, value) => sum + value, 0)
  const order = raw
    .map((value, index) => ({ index, rest: value - Math.floor(value) }))
    .sort((a, b) => b.rest - a.rest || a.index - b.index)
  for (const { index } of order) {
    if (remainder <= 0) break
    floors[index] = floors[index]! + 1
    remainder -= 1
  }
  return Object.fromEntries(keys.map((key, index) => [key, floors[index]!])) as CategoryShares<K>
}

/**
 * Setzt eine Kategorie auf `nextValue` und verteilt den Rest auf die übrigen — proportional zu
 * deren bisherigem Verhältnis, damit sich beim Ziehen eines Reglers nur der eingestellte Wert
 * gezielt ändert und die anderen ihr Verhältnis untereinander behalten. Stehen die anderen alle
 * auf 0, wird gleichmäßig verteilt (sonst bliebe die Summe unter 100 hängen). Bei nur zwei
 * Kategorien vereinfacht sich das automatisch zu „die andere bekommt den Rest".
 */
export const rebalanceCategoryShares = <K extends string>(
  keys: readonly K[],
  shares: CategoryShares<K>,
  changed: K,
  nextValue: number,
): CategoryShares<K> => {
  const value = Math.min(CATEGORY_SHARE_TOTAL, Math.max(0, Math.round(nextValue)))
  const others = keys.filter((key) => key !== changed)
  const othersTotal = others.reduce((sum, key) => sum + shares[key], 0)
  const rest = CATEGORY_SHARE_TOTAL - value
  const raw = keys.map((key) => {
    if (key === changed) return value
    return othersTotal > 0 ? (shares[key] / othersTotal) * rest : rest / others.length
  })
  const balanced = distribute(keys, raw)
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
 * Faktor, um den der Effekt einer einzelnen Kategorie gegenüber dem vollen Effekt gedämpft ist —
 * dieselbe Normierung wie im Worker (`zielort_category_factors`/`oepnv_category_factors` in
 * `config.py`): die größte Kategorie steht für 100 %, eine halb so groß gewichtete für 50 %. Bei
 * Gleichverteilung ist jede Kategorie also voll wirksam.
 */
export const categoryEffect = <K extends string>(
  keys: readonly K[],
  shares: CategoryShares<K>,
  category: K,
) => {
  const max = Math.max(...keys.map((key) => shares[key]))
  return max > 0 ? shares[category] / max : 0
}
