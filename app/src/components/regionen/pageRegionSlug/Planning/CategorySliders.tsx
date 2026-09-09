import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { twJoin } from 'tailwind-merge'
import {
  CATEGORY_SHARE_STEP,
  CATEGORY_SHARE_TOTAL,
  categoryEffect,
  rebalanceCategoryShares,
  type CategoryShares,
} from './categoryShares'
import { InfoTooltip } from './InfoTooltip'

/** Farbpunkte mit ihrem Anteil je Kategorie — zugeklappt der einzige Hinweis auf die Aufteilung. */
const SharePreview = <K extends string>({
  categories,
  shares,
}: {
  categories: { key: K; label: string; color: string }[]
  shares: CategoryShares<K>
}) => (
  <span className="flex items-center gap-1.5">
    {categories.map(({ key, label, color }) => (
      <span key={key} className="flex items-center gap-0.5" title={`${label}: ${shares[key]} %`}>
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-full ring-1 ring-gray-300"
          style={{ backgroundColor: color }}
        />
        <span className="text-[11px] text-gray-500 tabular-nums">{shares[key]}</span>
      </span>
    ))}
  </span>
)

/**
 * Verhältnis der Kategorien eines Faktors zueinander, als gekoppelte Regler: die Summe bleibt
 * immer 100 % — wird eine Kategorie hochgezogen, geben die übrigen anteilig ab
 * (`rebalanceCategoryShares`). Generisches UI-Gegenstück zu `categoryShares.ts`; bindet weder an
 * Zielorte noch ÖPNV, sondern nimmt Kategorienliste/Defaults/Beschriftung als Props (siehe
 * `zielortShares.ts`/`oepnvShares.ts` für die konkreten Bindungen).
 *
 * Diese 100 % gelten NUR innerhalb des jeweiligen Faktors; wie stark der Faktor insgesamt wirkt,
 * bleibt der Punkte-/Wichtigkeits-Regler darüber.
 *
 * Standardmäßig zugeklappt: zusätzliche Regler in einem ohnehin langen Formular sind für die
 * meisten Läufe nicht nötig (Gleichverteilung ist der Normalfall). Zugeklappt zeigt die Zeile
 * trotzdem die aktuellen Anteile, damit eine abweichende Aufteilung nicht unbemerkt bleibt.
 *
 * `open`/`onOpenChange` liegen bewusst außen (`FactorEditorPanel`): solange die Kategorien offen
 * sind, hebt sich die ganze Faktor-Zeile inklusive Haupt-Regler als eigene Karte ab, und dieser
 * Rahmen sitzt eine Ebene höher.
 */
export const CategorySliders = <K extends string>({
  categories,
  defaultShares,
  shares,
  onChange,
  open,
  onOpenChange,
  disabled = false,
  groupLabel,
  factorLabel,
}: {
  categories: { key: K; label: string; color: string; help: string }[]
  defaultShares: CategoryShares<K>
  shares: CategoryShares<K>
  onChange: (shares: CategoryShares<K>) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  disabled?: boolean
  /** Überschrift neben dem Klapp-Pfeil, z. B. „Zielort-Arten" / „ÖPNV-Arten". */
  groupLabel: string
  /** Name des übergeordneten Faktors für die Regler-`aria-label`s, z. B. „Zielorte". */
  factorLabel: string
}) => {
  const keys = categories.map((category) => category.key)
  const isDefault = categories.every(({ key }) => shares[key] === defaultShares[key])

  return (
    <div className={twJoin('mt-1', open && 'border-t border-gray-200 pt-1')}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          aria-expanded={open}
          className="flex items-center gap-0.5 text-[11px] tracking-wide text-gray-500 uppercase hover:text-gray-800"
        >
          <ChevronRightIcon
            className={twJoin('size-3.5 transition-transform', open && 'rotate-90')}
          />
          {groupLabel}
        </button>
        {!open && <SharePreview categories={categories} shares={shares} />}
        {open && !isDefault && !disabled && (
          <button
            type="button"
            onClick={() => onChange({ ...defaultShares })}
            className="ml-auto text-[11px] font-medium text-gray-500 hover:text-gray-800"
          >
            Gleich verteilen
          </button>
        )}
      </div>

      {open && (
        <div className={twJoin('mt-0.5 space-y-1', disabled && 'opacity-50')}>
          {categories.map(({ key, label, color, help }) => {
            const share = shares[key]
            const effect = Math.round(categoryEffect(keys, shares, key) * 100)
            return (
              <div key={key}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="flex items-center gap-1 text-xs text-gray-700">
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 rounded-full ring-1 ring-gray-300"
                      style={{ backgroundColor: color }}
                    />
                    {label}
                    <InfoTooltip>{help}</InfoTooltip>
                  </span>
                  <span className="flex shrink-0 items-baseline gap-1.5">
                    {effect < 100 && (
                      <span className="text-[11px] text-gray-400 tabular-nums">
                        wirkt zu {effect} %
                      </span>
                    )}
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-800 tabular-nums">
                      {share} %
                    </span>
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={CATEGORY_SHARE_TOTAL}
                  step={CATEGORY_SHARE_STEP}
                  value={share}
                  disabled={disabled}
                  aria-label={`${label} — Anteil am Faktor ${factorLabel} in Prozent`}
                  style={{ accentColor: color }}
                  onChange={(e) =>
                    onChange(rebalanceCategoryShares(keys, shares, key, Number(e.target.value)))
                  }
                  className="w-full"
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
