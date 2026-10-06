import { useId, useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { systemStatusConfig } from '@/components/regionen/pageRegionSlug/modes/qa/detail/qaConfigs'
import { inputBase, inputNormal, labelClass } from '@/components/shared/form/fields/sharedStyles'
import type { FormApi } from '@/components/shared/form/types'
import { percentToFraction } from '@/shared/qaThresholdPercent'
import type { QaConfigFormValues } from './QaConfigForm'
import { computeQaThresholdRanges, evaluateQaThresholdPreview } from './qaThresholdCalculations'

const DEFAULT_REFERENCE_INPUT = '20'
const DEFAULT_CURRENT_INPUT = '24'
/** Sample counts in the preview; above this the range scan would be pointless. */
const MAX_PREVIEW_COUNT = 100_000

/** A non-negative whole count, or `null` when the input isn't one (empty, negative, not a number). */
function parseCount(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) return null
  if (parsed > MAX_PREVIEW_COUNT) return null
  return parsed
}

/**
 * Live "Probe-Rechnung": runs the form's current (unsaved) threshold values through the real
 * evaluation rules against two example counts, so admins can see what a run would look like
 * before saving. Its reference/current inputs and the trusted-editor checkbox are local UI state,
 * not part of the form — they're never submitted.
 */
export function QaThresholdPreview({ form }: { form: FormApi<QaConfigFormValues> }) {
  const [referenceInput, setReferenceInput] = useState(DEFAULT_REFERENCE_INPUT)
  const [currentInput, setCurrentInput] = useState(DEFAULT_CURRENT_INPUT)
  const [trustedEditorsChecked, setTrustedEditorsChecked] = useState(false)
  const trustedCheckboxId = useId()

  return (
    <form.Subscribe
      selector={(s) =>
        [
          s.values.goodThreshold,
          s.values.needsReviewThreshold,
          s.values.absoluteDifferenceThreshold,
          s.values.trustedOsmUsernames,
          s.values.referenceFrozenAt,
        ] as const
      }
    >
      {([
        goodThresholdPercent,
        needsReviewThresholdPercent,
        absoluteDifferenceThresholdRaw,
        trustedOsmUsernames,
        referenceFrozenAt,
      ]) => {
        const goodThresholdFraction = percentToFraction(Number(goodThresholdPercent) || 0)
        const needsReviewThresholdFraction = percentToFraction(
          Number(needsReviewThresholdPercent) || 0,
        )
        const absoluteDifferenceThreshold = Number(absoluteDifferenceThresholdRaw) || 0
        const trustListReady = trustedOsmUsernames.trim() !== '' && referenceFrozenAt.trim() !== ''

        const reference = parseCount(referenceInput)
        const current = parseCount(currentInput)
        const hasValidInputs = reference !== null && current !== null

        const result = hasValidInputs
          ? evaluateQaThresholdPreview({
              reference,
              current,
              goodThresholdFraction,
              needsReviewThresholdFraction,
              absoluteDifferenceThreshold,
              changedByTrustedEditors: trustListReady && trustedEditorsChecked,
            })
          : null

        const ranges =
          reference !== null
            ? computeQaThresholdRanges({
                reference,
                goodThresholdFraction,
                needsReviewThresholdFraction,
                absoluteDifferenceThreshold,
              })
            : null

        const pillConfig = result ? systemStatusConfig[result.effectiveSystemStatus] : null

        return (
          <section
            aria-labelledby="qa-threshold-preview-title"
            className="rounded-md bg-gray-50 p-4 ring-1 ring-gray-900/5"
          >
            <h3 id="qa-threshold-preview-title" className="text-sm font-semibold text-gray-900">
              Probe-Rechnung
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Prüft die eingestellten Schwellenwerte an zwei Beispielzahlen — wird nicht
              gespeichert.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="qa-threshold-preview-reference" className={labelClass}>
                  Referenz (Stellplätze)
                </label>
                <input
                  id="qa-threshold-preview-reference"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={referenceInput}
                  onChange={(e) => setReferenceInput(e.target.value)}
                  className={twJoin(inputBase, inputNormal, 'bg-white')}
                />
              </div>
              <div>
                <label htmlFor="qa-threshold-preview-current" className={labelClass}>
                  Aktueller Lauf (Stellplätze)
                </label>
                <input
                  id="qa-threshold-preview-current"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  className={twJoin(inputBase, inputNormal, 'bg-white')}
                />
              </div>
            </div>

            <label
              htmlFor={trustedCheckboxId}
              className={twJoin(
                'mt-3 flex items-start gap-2 text-sm text-gray-700',
                !trustListReady && 'cursor-not-allowed opacity-60',
              )}
            >
              <input
                id={trustedCheckboxId}
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={trustedEditorsChecked}
                disabled={!trustListReady}
                onChange={(e) => setTrustedEditorsChecked(e.target.checked)}
              />
              <span>
                Änderungen stammen von Nutzer:innen der Vertrauensliste
                {!trustListReady && (
                  <span className="block text-xs text-gray-500">
                    Wirkt erst, wenn „Vertrauensliste“ und „Referenz eingefroren am“ ausgefüllt
                    sind.
                  </span>
                )}
              </span>
            </label>

            {/* Live result of the two example numbers above — recomputed on every keystroke. */}
            <output
              htmlFor={`qa-threshold-preview-reference qa-threshold-preview-current ${trustedCheckboxId}`}
              className="block"
            >
              {!hasValidInputs ? (
                <p className="mt-4 text-sm text-red-800" role="alert">
                  Bitte für Referenz und aktuellen Lauf jeweils eine ganze Zahl ≥ 0 eingeben.
                </p>
              ) : (
                result && (
                  <div className="mt-4 space-y-3">
                    {pillConfig && (
                      <span className="inline-flex items-center gap-2 rounded-md bg-white px-2.5 py-1 text-sm font-medium text-gray-900 ring-1 ring-gray-900/5">
                        <span
                          aria-hidden="true"
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: pillConfig.hexColor }}
                        />
                        {pillConfig.label}
                      </span>
                    )}
                    <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-700">
                      {result.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )
              )}

              {ranges && (
                <p className="mt-4 border-t border-gray-200 pt-3 text-sm text-gray-600">
                  Bereiche bei Referenz {ranges.reference}: Gut: {ranges.byStatus.GOOD} ·
                  Überprüfung: {ranges.byStatus.NEEDS_REVIEW} · Problematisch:{' '}
                  {ranges.byStatus.PROBLEMATIC}
                </p>
              )}
            </output>
          </section>
        )
      }}
    </form.Subscribe>
  )
}
