import { AdminTrashIconButton } from '@/components/admin/AdminTrashIconButton'
import { Select } from '@/components/shared/form/fields/Select'
import { TextField } from '@/components/shared/form/fields/TextField'
import { uniqueFormattedFormErrors } from '@/components/shared/form/formatError'
import type { FormApi } from '@/components/shared/form/types'
import { buttonStylesSecondary } from '@/components/shared/links/styles'
import { type QaDatasetKey, qaDatasets } from '@/server/qa-configs/qaDatasets.const'
import { type QaIndicatorDraft, qaIndicatorsToDrafts } from '@/server/qa-configs/schemas'
import { QA_TOTAL_INDICATOR_KEY } from '@/server/qa-configs/schemas/qaIndicatorsSchema'
import { getQaIndicatorAttributes } from '@/server/qa-configs/schemas/validateQaIndicatorTagKeys'
import type { QaConfigFormValues } from './QaConfigForm'
import { QaIndicatorPreview } from './QaIndicatorPreview'
import { QaPercentField } from './QaPercentField'

const emptyDraft: QaIndicatorDraft = {
  key: '',
  label: '',
  goodThreshold: '10',
  needsReviewThreshold: '20',
  absoluteDifferenceThreshold: '0',
}

/** Selectable Merkmale: the plain total first, then the tags the amount can be split by. */
function indicatorChoices(dataset: QaDatasetKey | '') {
  if (!dataset) return []
  const { totalLabel, unit } = qaDatasets[dataset]
  return [
    { key: QA_TOTAL_INDICATOR_KEY, label: totalLabel, text: `Gesamtmenge (${unit})` },
    ...getQaIndicatorAttributes(dataset).map((attribute) => ({
      key: attribute.key,
      label: attribute.label,
      text: `${unit} je ${attribute.label} (${attribute.key})`,
    })),
  ]
}

type Props = {
  form: FormApi<QaConfigFormValues>
  configId: number | undefined
}

export function QaIndicatorsField({ form, configId }: Props) {
  return (
    <form.Subscribe selector={(state) => state.values.dataset}>
      {(dataset) => (
        <form.Field name="indicators" mode="array">
          {(field) => (
            <div className="space-y-4">
              <ul className="space-y-4">
                {field.state.value.map((_, index) => (
                  // oxlint-disable-next-line react/no-array-index-key -- rows are addressed by index (`indicators[i]`), like the form state
                  <li key={index}>
                    <QaIndicatorRow
                      form={form}
                      index={index}
                      dataset={dataset}
                      configId={configId}
                      onRemove={() => field.removeValue(index)}
                    />
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={buttonStylesSecondary}
                  onClick={() => field.pushValue(emptyDraft)}
                >
                  + Indikator hinzufügen
                </button>
                {dataset && field.state.value.length === 0 ? (
                  <button
                    type="button"
                    className={buttonStylesSecondary}
                    onClick={() =>
                      field.setValue(qaIndicatorsToDrafts(qaDatasets[dataset].defaultIndicators))
                    }
                  >
                    Standard-Indikatoren übernehmen
                  </button>
                ) : null}
              </div>

              {field.state.meta.errors.length > 0 ? (
                <div role="alert" className="text-sm text-red-800">
                  {uniqueFormattedFormErrors(field.state.meta.errors).map((message) => (
                    <p key={message}>{message}</p>
                  ))}
                </div>
              ) : null}

              {field.state.meta.isDirty ? (
                <p className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                  Wirkt ab dem nächsten Processing-Lauf. Neue Indikatoren bekommen erst mit dem
                  nächsten Freeze Referenzwerte und bleiben bis dahin ohne Bewertung.
                </p>
              ) : null}
            </div>
          )}
        </form.Field>
      )}
    </form.Subscribe>
  )
}

type RowProps = Props & {
  index: number
  dataset: QaDatasetKey | ''
  onRemove: () => void
}

function QaIndicatorRow({ form, configId, index, dataset, onRemove }: RowProps) {
  const unit = dataset ? qaDatasets[dataset].unit : ''
  const choices = indicatorChoices(dataset)

  return (
    <fieldset className="space-y-4 rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between gap-2">
        <legend className="text-sm font-semibold text-gray-800">Indikator {index + 1}</legend>
        <AdminTrashIconButton ariaLabel={`Indikator ${index + 1} entfernen`} onClick={onRemove} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select
          form={form}
          name={`indicators[${index}].key`}
          label="Merkmal"
          options={[
            ['', dataset ? '— Merkmal wählen —' : '— erst Datensatz wählen —'],
            ...choices.map((choice): [string, string] => [choice.key, choice.text]),
          ]}
          // The label belongs to the Merkmal; picking another one starts from its name.
          onValueChange={(key) =>
            form.setFieldValue(
              `indicators[${index}].label`,
              choices.find((choice) => choice.key === key)?.label ?? '',
            )
          }
        />
        <TextField form={form} name={`indicators[${index}].label`} label="Label" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <QaPercentField
          form={form}
          name={`indicators[${index}].goodThreshold`}
          label="Gut bis"
          help="Abweichung bis zu diesem Wert: „Gut“ (grün)."
        />
        <QaPercentField
          form={form}
          name={`indicators[${index}].needsReviewThreshold`}
          label="Überprüfung bis"
          help="Bis zu diesem Wert: „Überprüfung nötig“ (gelb), darüber „Problematisch“ (rot)."
        />
        <TextField
          form={form}
          name={`indicators[${index}].absoluteDifferenceThreshold`}
          label={`Absolute Toleranz (${unit || 'Einheit'})`}
          type="number"
          min={0}
          step="any"
          help="Eine Differenz bis hierhin ist immer „Gut“, egal wie groß die Abweichung ist."
        />
      </div>

      <form.Subscribe selector={(state) => state.values.indicators[index]}>
        {(draft) =>
          draft ? (
            <QaIndicatorPreview key={draft.key} draft={draft} unit={unit} configId={configId} />
          ) : null
        }
      </form.Subscribe>
    </fieldset>
  )
}
