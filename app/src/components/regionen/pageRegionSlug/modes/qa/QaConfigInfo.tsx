import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { formatDate } from '@/components/shared/date/formatDate'
import { ModalDialog } from '@/components/shared/Modal/ModalDialog'
import { captureModalOpenOrigin } from '@/components/shared/motion/modalOpenOrigin'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import { formatNumber, formatPercentage } from '@/components/shared/utils/formatNumber'
import { qaAreaFilterLabels, qaDatasets } from '@/server/qa-configs/qaDatasets.const'
import type { getQaConfigsForRegion } from '@/server/qa-configs/queries/getQaConfigsForRegion.server'
import { modePanelHeaderIconButtonClassName } from '../modePanel.const'
import { QA_SYSTEM_STATUS_COLORS } from './detail/qaConfigs'

type Props = {
  config: Awaited<ReturnType<typeof getQaConfigsForRegion>>[number]
}

const LABEL = 'Einstellungen dieser Konfiguration'

/** The color of the status on the map and in the list. */
const StatusDot = ({ status }: { status: keyof typeof QA_SYSTEM_STATUS_COLORS }) => (
  <span
    aria-hidden
    className="mr-1.5 inline-block size-2 rounded-full"
    style={{ backgroundColor: QA_SYSTEM_STATUS_COLORS[status] }}
  />
)

/** Header action of the QA panel: the settings of the active config, read-only. */
export const QaConfigInfo = ({ config }: Props) => {
  const [open, setOpen] = useState(false)
  const dataset = qaDatasets[config.dataset]

  const rows = [
    ['Datensatz', dataset.label],
    ['Status', config.isActive ? 'Aktiv' : 'Inaktiv'],
    ['Flächen', qaAreaFilterLabels[config.areaFilter]],
    ['Referenz vom', formatDate(config.referenceFrozenAt)],
    [
      'Vertrauensliste',
      config.trustedOsmUsernames.length > 0 ? config.trustedOsmUsernames.join(', ') : '–',
    ],
  ] as const

  return (
    <>
      <Tooltip text={LABEL}>
        <button
          type="button"
          onClick={(event) => {
            captureModalOpenOrigin(event.currentTarget)
            setOpen(true)
          }}
          aria-label={LABEL}
          className={modePanelHeaderIconButtonClassName}
        >
          <InformationCircleIcon className="size-5" aria-hidden />
        </button>
      </Tooltip>

      <ModalDialog
        title={config.label}
        icon="info"
        mode="qa"
        open={open}
        setOpen={setOpen}
        buttonCloseName="Schließen"
      >
        <div className="space-y-4 text-sm text-gray-700">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-gray-500">{label}</dt>
                <dd className="wrap-break-word">{value}</dd>
              </div>
            ))}
          </dl>

          <table className="w-full text-left">
            <caption className="pb-1 text-left font-medium text-gray-900">
              Attribute und Schwellwerte
            </caption>
            <thead className="text-gray-500">
              <tr>
                <th scope="col" className="pr-3 font-normal">
                  Attribut
                </th>
                <th scope="col" className="pr-3 text-right font-normal">
                  <StatusDot status="GOOD" />
                  Gut bis
                </th>
                <th scope="col" className="pr-3 text-right font-normal">
                  <StatusDot status="NEEDS_REVIEW" />
                  Zu prüfen bis
                </th>
                <th scope="col" className="text-right font-normal">
                  <StatusDot status="GOOD" />
                  Immer gut bis
                </th>
              </tr>
            </thead>
            <tbody>
              {config.indicators.map((indicator) => (
                <tr key={indicator.key} className="border-t border-gray-200 align-baseline">
                  <th scope="row" className="py-1 pr-3 font-normal">
                    {indicator.label} <code className="text-gray-500">{indicator.key}</code>
                  </th>
                  <td className="py-1 pr-3 text-right tabular-nums">
                    {formatPercentage(indicator.goodThreshold)}
                  </td>
                  <td className="py-1 pr-3 text-right tabular-nums">
                    {formatPercentage(indicator.needsReviewThreshold)}
                  </td>
                  <td className="py-1 text-right whitespace-nowrap tabular-nums">
                    {formatNumber(indicator.absoluteDifferenceThreshold)} {dataset.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-gray-500">
            Eine Abweichung über »Zu prüfen bis« gilt als problematisch. Eine Differenz bis »Immer
            gut bis« gilt unabhängig von der Abweichung als gut.
          </p>
        </div>
      </ModalDialog>
    </>
  )
}
