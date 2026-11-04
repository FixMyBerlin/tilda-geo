import { useSuspenseQuery } from '@tanstack/react-query'
import { useQaParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useQaParam'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { frenchQuote } from '@/components/shared/text/Quotes'
import { regionQaConfigsQueryOptions } from '@/server/regions/regionQueryOptions'
import { ModeCollectionSelect } from '../ModeCollectionSelect'
import { ModeFilterBar } from '../ModeFilterBar'
import { ModePanel } from '../ModePanel'
import { modePanelMutedClassName } from '../modePanel.const'
import { useModeDetailSelection } from '../useModeDetailSelection'
import { QaDetail } from './detail/QaDetail'
import { QaConfigInfo } from './QaConfigInfo'
import {
  QA_DEFAULT_STATUS_KEYS,
  resolvedQaIndicatorKeys,
  resolvedQaStatusKeys,
} from './qaConfigStyles'
import { QaIndicatorDropdown } from './QaIndicatorDropdown'
import { QaModeAreaList } from './QaModeAreaList'
import { QaStatusDropdown } from './QaStatusDropdown'
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
  const indicators = activeConfig?.indicators ?? []
  const indicatorKeys = resolvedQaIndicatorKeys(
    qaParamData.ind,
    indicators.map((indicator) => indicator.key),
  )

  const setConfig = (configSlug: string) => {
    // Indicator keys belong to one config; keeping them would filter the new config's map to nothing.
    setQaParamData({
      ...qaParamData,
      key: configSlug,
      ind: undefined,
      status: qaParamData.status ?? QA_DEFAULT_STATUS_KEYS,
    })
  }

  const qaDetail = selected
    ? {
        title: `Bereich #${selected.id}`,
        onBack: clearModeDetail,
        children: <QaDetail key={String(selected.id)} areaId={String(selected.id)} />,
      }
    : undefined

  return (
    <ModePanel
      title={activeConfig ? `QA: ${frenchQuote(activeConfig.label)}` : 'Qualitätssicherung'}
      detail={qaDetail}
      actions={activeConfig && !selected ? <QaConfigInfo config={activeConfig} /> : undefined}
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
          <QaStatusDropdown />
          {selectedKey && activeConfig ? (
            <>
              <QaIndicatorDropdown indicators={indicators} />
              <QaUserDropdown configId={activeConfig.id} regionSlug={region.slug} />
            </>
          ) : null}
        </ModeFilterBar>
      }
    >
      {selectedKey ? (
        <QaModeAreaList
          configSlug={selectedKey}
          regionSlug={region.slug}
          status={resolvedQaStatusKeys(qaParamData.status)}
          users={qaParamData.users}
          indicatorKeys={qaParamData.ind && qaParamData.ind.length > 0 ? indicatorKeys : undefined}
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
