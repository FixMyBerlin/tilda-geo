import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { format, formatDistanceToNow, fromUnixTime } from 'date-fns'
import { de } from 'date-fns/locale'
import { useId } from 'react'
import { twJoin } from 'tailwind-merge'
import {
  useMapActions,
  useMapInspectorOtherPropertiesOpen,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { Link } from '@/components/shared/links/Link'
import { MotionCollapse } from '@/components/shared/motion/MotionCollapse'
import { TopicDocAttributePurposePill } from '@/components/shared/topicDocs/TopicDocAttributePurposePill'
import { isProd } from '@/components/shared/utils/isEnv'
import { topicDocPurposeMeta, topicDocPurposeOrder } from '@/data/topicDocs/purpose'
import { getInspectorAttributePurpose } from '@/data/topicDocs/runtime'
import type { TopicDocAttributePurpose } from '@/data/topicDocs/schema'
import type { InspectorFeature } from '../Inspector'
import { tilesInspectorWithGeomUrl } from './osmUrls/osmUrls'

type Props = {
  feature: InspectorFeature['feature']
  sourceId: string
}

const metaKeySet = new Set([
  'changeset_id',
  'id',
  'osm_id',
  'osm_type',
  'osm_url',
  'updated_at',
  'updated_by',
  'version',
])

type PropertyEntry = [key: string, value: unknown]

const formatPropertyValue = (value: unknown) => {
  return typeof value === 'boolean' ? JSON.stringify(value) : String(value)
}

const PropertyRow = ({ keyName, value }: { keyName: string; value: unknown }) => (
  <p className="mb-0.5 border-b border-gray-200 pb-0.5">
    <code title={`${value} is a ${typeof value}`}>
      {keyName}: {formatPropertyValue(value)}{' '}
      {keyName.startsWith('osm_') && (
        <Link
          blank
          href={`https://wiki.openstreetmap.org/wiki/Tag:${keyName}=${String(value)}`}
          title="OpenStreetMap Wiki"
          className="scale-75"
        >
          Wiki
        </Link>
      )}
    </code>
  </p>
)

export const ToolsOtherProperties = ({ feature, sourceId }: Props) => {
  const panelId = useId()
  const inspectorOtherPropertiesOpen = useMapInspectorOtherPropertiesOpen()
  const { setInspectorOtherPropertiesVisibility } = useMapActions()

  const allEntries = Object.entries(feature.properties).sort((a, b) => a[0].localeCompare(b[0]))
  const leftColumnEntries: Array<PropertyEntry> = []
  const metaEntries: Array<PropertyEntry> = []
  const purposeEntries = new Map<TopicDocAttributePurpose, Array<PropertyEntry>>()

  for (const [key, value] of allEntries) {
    if (metaKeySet.has(key)) {
      metaEntries.push([key, value])
      continue
    }

    const purpose = getInspectorAttributePurpose(sourceId, key)
    if (purpose) {
      const existing = purposeEntries.get(purpose) ?? []
      existing.push([key, value])
      purposeEntries.set(purpose, existing)
      continue
    }

    leftColumnEntries.push([key, value])
  }

  const viewerUrl =
    !isProd && feature.sourceLayer && feature.geometry
      ? tilesInspectorWithGeomUrl({
          geometry: feature.geometry,
          sourceLayer: feature.sourceLayer,
        })
      : undefined

  return (
    <div className="mt-3">
      <button
        type="button"
        className="flex cursor-pointer items-center text-left font-semibold text-gray-600 hover:text-gray-800"
        aria-expanded={inspectorOtherPropertiesOpen}
        aria-controls={panelId}
        onClick={() => setInspectorOtherPropertiesVisibility(!inspectorOtherPropertiesOpen)}
      >
        <ChevronRightIcon
          className={twJoin(
            'mr-1 -ml-1.5 size-5 shrink-0 transition-transform',
            inspectorOtherPropertiesOpen ? 'rotate-90 transform' : '',
          )}
        />
        <span>Weitere Daten an diesem Element</span>
      </button>
      <MotionCollapse open={inspectorOtherPropertiesOpen}>
        <div id={panelId} className="mt-3 grid grid-cols-2 gap-4 text-xs break-all">
          <div>
            <h5 className="mb-2 font-semibold">Inhaltliche Daten</h5>
            {leftColumnEntries.length ? (
              leftColumnEntries.map(([key, value]) => (
                <PropertyRow key={key} keyName={key} value={value} />
              ))
            ) : (
              <p>./.</p>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <h5 className="font-semibold">Meta</h5>
              </div>
              <p className="mb-0.5 border-b border-gray-200 pb-0.5">
                <strong>
                  <code>feature.id</code>
                </strong>
                : {feature.id || 'MISSING'}
              </p>
              <p className="mb-0.5 border-b border-gray-200 pb-0.5">
                <strong>
                  <code>sourceLayer</code>
                </strong>
                : {feature.sourceLayer || 'UNBEKANNT'}
                {viewerUrl && (
                  <>
                    {' '}
                    <Link blank href={viewerUrl} className="scale-75">
                      Viewer
                    </Link>
                  </>
                )}
              </p>
              {metaEntries.length ? (
                metaEntries.map(([key, value]) => (
                  <PropertyRow key={key} keyName={key} value={value} />
                ))
              ) : (
                <p>./.</p>
              )}
              {feature.properties.updated_at && (
                <p className="mt-3">
                  <strong className="font-semibold">Letzte Änderung:</strong>
                  <br />
                  {format(
                    fromUnixTime(Number(feature.properties.updated_at)),
                    'dd.MM.yyyy HH:mm:ss',
                    { locale: de },
                  )}
                  <br />
                  {formatDistanceToNow(fromUnixTime(Number(feature.properties.updated_at)), {
                    addSuffix: true,
                    locale: de,
                  })}
                </p>
              )}
            </div>

            {topicDocPurposeOrder.map((purpose) => {
              const entries = purposeEntries.get(purpose) ?? []
              if (!entries.length) return null

              return (
                <div key={purpose}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h5 className="font-semibold">{topicDocPurposeMeta[purpose].heading}</h5>
                    <TopicDocAttributePurposePill purpose={purpose} />
                  </div>
                  <p className="mb-2 text-[11px] text-gray-600">
                    {topicDocPurposeMeta[purpose].legendText}
                  </p>
                  {entries.map(([key, value]) => (
                    <PropertyRow key={key} keyName={key} value={value} />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </MotionCollapse>
    </div>
  )
}
