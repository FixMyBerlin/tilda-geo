import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { twJoin } from 'tailwind-merge'
import { InfoTooltip } from './InfoTooltip'
import { DEFAULT_ZIELORT_SHARES, ZIELORT_CATEGORIES } from './zielortCategories'
import {
  rebalanceZielortShares,
  ZIELORT_SHARE_STEP,
  ZIELORT_SHARE_TOTAL,
  zielortCategoryEffect,
  type ZielortShares,
} from './zielortShares'

/** Vier Farbpunkte mit ihrem Anteil — zugeklappt der einzige Hinweis auf die Aufteilung. */
const SharePreview = ({ shares }: { shares: ZielortShares }) => (
  <span className="flex items-center gap-1.5">
    {ZIELORT_CATEGORIES.map(({ key, label, color }) => (
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
 * Verhältnis der vier Zielort-Kategorien zueinander, als gekoppelte Regler: die Summe bleibt immer
 * 100 % — wird eine Kategorie hochgezogen, geben die übrigen drei anteilig ab
 * (`rebalanceZielortShares`).
 *
 * Diese 100 % gelten NUR innerhalb des Faktors „Zielorte"; wie stark der Faktor insgesamt wirkt,
 * bleibt der Punkte-Regler darüber (`w_target`). Die Reglerfarben sind die Kategoriefarben des
 * Zielorte-Layers auf der Karte (siehe `zielortCategories.ts`).
 *
 * Standardmäßig zugeklappt: vier zusätzliche Regler in einem ohnehin langen Formular sind für die
 * meisten Läufe nicht nötig (Gleichverteilung ist der Normalfall). Zugeklappt zeigt die Zeile
 * trotzdem die aktuellen Anteile, damit eine abweichende Aufteilung nicht unbemerkt bleibt.
 *
 * `open`/`onOpenChange` liegen bewusst außen (`FactorEditorPanel`): solange die Kategorien offen
 * sind, hebt sich die ganze Zielorte-Zeile inklusive Faktor-Regler als eigene Karte ab, und dieser
 * Rahmen sitzt eine Ebene höher.
 */
export const ZielortCategorySliders = ({
  shares,
  onChange,
  open,
  onOpenChange,
  disabled = false,
}: {
  shares: ZielortShares
  onChange: (shares: ZielortShares) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  disabled?: boolean
}) => {
  const isDefault = ZIELORT_CATEGORIES.every(
    ({ key }) => shares[key] === DEFAULT_ZIELORT_SHARES[key],
  )

  return (
    // Aufgeklappt trennt eine dünne Linie die Arten vom Faktor-Regler darüber — beide sitzen dann
    // in derselben hervorgehobenen Karte (siehe `FactorEditorPanel`).
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
          Zielort-Arten
        </button>
        {!open && <SharePreview shares={shares} />}
        {/* Zurück auf 25/25/25/25 — der Stand, bei dem alle vier Arten gleich zählen. */}
        {open && !isDefault && !disabled && (
          <button
            type="button"
            onClick={() => onChange({ ...DEFAULT_ZIELORT_SHARES })}
            className="ml-auto text-[11px] font-medium text-gray-500 hover:text-gray-800"
          >
            Gleich verteilen
          </button>
        )}
      </div>

      {open && (
        <div className={twJoin('mt-0.5 space-y-1', disabled && 'opacity-50')}>
          {ZIELORT_CATEGORIES.map(({ key, label, color, help }) => {
            const share = shares[key]
            const effect = Math.round(zielortCategoryEffect(shares, key) * 100)
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
                  max={ZIELORT_SHARE_TOTAL}
                  step={ZIELORT_SHARE_STEP}
                  value={share}
                  disabled={disabled}
                  aria-label={`${label} — Anteil am Faktor Zielorte in Prozent`}
                  style={{ accentColor: color }}
                  onChange={(e) =>
                    onChange(rebalanceZielortShares(shares, key, Number(e.target.value)))
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
