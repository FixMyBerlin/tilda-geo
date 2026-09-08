import { useSuspenseQuery } from '@tanstack/react-query'
import { useQaParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useQaParam'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { frenchQuote } from '@/components/shared/text/Quotes'
import { regionQaConfigsQueryOptions } from '@/server/regions/regionQueryOptions'
import { ModeCollectionSelect } from '../ModeCollectionSelect'
import { ModeFilterBar } from '../ModeFilterBar'
import { ModeFilterSelect, modeFilterIcons } from '../ModeFilterSelect'
import { ModePanel } from '../ModePanel'
import { modePanelMutedClassName } from '../modePanel.const'
import { useModeDetailSelection } from '../useModeDetailSelection'
import { QaDetail } from './detail/QaDetail'
import {
  QA_DEFAULT_STATUS_KEY,
  QA_STATUS_FILTER_OPTIONS,
  QA_STATUS_SELECT_ALL,
  resolvedQaStatusSelectValue,
  zodQaStatusKey,
  type QaStatusKey,
} from './qaConfigStyles'
import { QaModeAreaList } from './QaModeAreaList'
import { QaUserDropdown } from './QaUserDropdown'

export const PageModeQa = () => {
  const region = useRegion()
  const { qaParamData, setQaParamData } = useQaParam()
  const { selected, clearModeDetail } = useModeDetailSelection()

  const { data: configs } = useSuspenseQuery(regionQaConfigsQueryOptions(region.slug))
  const defaultConfig = configs[0]
  const selectedKey = qaParamData.key || defaultConfig?.slug || ''
  const activeConfig = configs.find((config) => config.slug === selectedKey)
  const extent = qaParamData.extent ?? 'view'

  const setConfig = (configSlug: string) => {
    setQaParamData({
      ...qaParamData,
      key: configSlug,
      status: qaParamData.status ?? QA_DEFAULT_STATUS_KEY,
    })
  }

  const statusSelectValue = resolvedQaStatusSelectValue(qaParamData.status)

  const setStatus = (value: string) => {
    if (!selectedKey) return
    if (value === QA_STATUS_SELECT_ALL) {
      setQaParamData({
        ...qaParamData,
        key: selectedKey,
        status: QA_STATUS_SELECT_ALL,
      })
      return
    }
    const parsed = zodQaStatusKey.safeParse(value)
    if (!parsed.success) return
    setQaParamData({
      ...qaParamData,
      key: selectedKey,
      status: parsed.data satisfies QaStatusKey,
    })
  }

  const qaDetail = selected
    ? {
        title: `Bereich #${selected.id}`,
        onBack: clearModeDetail,
        children: <QaDetail areaId={String(selected.id)} />,
      }
    : undefined

  return (
    <ModePanel
      title={activeConfig ? `QA: ${frenchQuote(activeConfig.label)}` : 'Qualitätssicherung'}
      detail={qaDetail}
      collection={
        configs.length === 0 ? undefined : (
          <ModeCollectionSelect
            aria-label="Konfiguration"
            value={selectedKey}
            options={configs.map((config) => ({
              value: config.slug,
              label: config.label,
              private: true,
              inactive: !config.isActive,
            }))}
            onChange={setConfig}
          />
        )
      }
      filter={
        <ModeFilterBar
          search={qaParamData.search ?? ''}
          onSearchChange={(search) =>
            setQaParamData({
              ...qaParamData,
              key: selectedKey,
              search: search || undefined,
            })
          }
          searchPlaceholder="Bereiche durchsuchen…"
          extent={extent}
          onExtentChange={(next) =>
            setQaParamData({
              ...qaParamData,
              key: selectedKey,
              extent: next,
            })
          }
        >
          <ModeFilterSelect
            label="Status"
            icon={modeFilterIcons.status}
            value={statusSelectValue}
            options={[...QA_STATUS_FILTER_OPTIONS]}
            onChange={setStatus}
          />
          {selectedKey && activeConfig ? (
            <QaUserDropdown configId={activeConfig.id} regionSlug={region.slug} />
          ) : null}
        </ModeFilterBar>
      }
    >
      {selectedKey ? (
        <QaModeAreaList
          configSlug={selectedKey}
          regionSlug={region.slug}
          status={statusSelectValue}
          users={qaParamData.users}
          search={qaParamData.search ?? ''}
          extent={extent}
        />
      ) : (
        <p className={`px-4 py-3 ${modePanelMutedClassName}`}>
          Keine Qualitätssicherungs-Konfiguration.
        </p>
      )}
    </ModePanel>
  )
}
