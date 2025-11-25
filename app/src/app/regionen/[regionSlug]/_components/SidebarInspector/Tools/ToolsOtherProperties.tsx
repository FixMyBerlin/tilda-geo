import { Link } from '@/src/app/_components/links/Link'
import { LinkExternal } from '@/src/app/_components/links/LinkExternal'
import { isProd } from '@/src/app/_components/utils/isEnv'
import { format, formatDistanceToNow, fromUnixTime } from 'date-fns'
import { de } from 'date-fns/locale'
import { InspectorFeature } from '../Inspector'
import { tilesInspectorWithGeomUrl } from './osmUrls/osmUrls'

type Props = {
  feature: InspectorFeature['feature']
  documentedKeys: string[] | undefined | false
}

export const ToolsOtherProperties = ({ feature, documentedKeys }: Props) => {
  const systemKeys = [
    '_todos',
    'fresh',
    'osm_id',
    'osm_type',
    'osm_url',
    'updated_at',
    'updated_age',
    'updated_by',
    'changeset_id',
    // 'verified_at',
    // 'verified',
    'version',
    'length',
    'offset',
    'side',
    'sign',
    'prefix',
    'id',
    'mapillary_coverage',
  ]
  const otherOsmProperties = Object.entries(feature.properties)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .filter(([key, _v]) => !systemKeys.includes(key))

  const systemProperties = Object.entries(feature.properties)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .filter(
      ([key, _v]) => systemKeys.includes(key) && documentedKeys && !documentedKeys?.includes(key),
    )

  const viewerUrl =
    !isProd && feature.sourceLayer && feature.geometry
      ? tilesInspectorWithGeomUrl({
          geometry: feature.geometry,
          sourceLayer: feature.sourceLayer,
        })
      : undefined

  return (
    <details className="mt-3">
      <summary className="ml-1.5 cursor-pointer font-semibold text-gray-600">
        <span className="ml-1.5">Weitere Daten an diesem Element</span>
      </summary>
      <div className="mt-3 grid grid-cols-2 gap-4 break-all text-xs">
        <div>
          <h5 className="mb-2 font-semibold">Inhaltliche Daten</h5>
          {otherOsmProperties.length ? (
            otherOsmProperties.map(([key, value]) => {
              return (
                <p key={key} className="mb-0.5 border-b border-gray-200 pb-0.5">
                  <code title={`${key}=${value}: ${value} is a ${typeof value}`}>
                    {key}: {typeof value === 'boolean' ? JSON.stringify(value) : value}{' '}
                    {key.startsWith('osm_') && (
                      <Link
                        blank
                        href={`https://wiki.openstreetmap.org/wiki/Tag:${key}=${value}`}
                        title="OpenStreetMap Wiki"
                        className="scale-75"
                      >
                        Wiki
                      </Link>
                    )}
                  </code>
                </p>
              )
            })
          ) : (
            <p>./.</p>
          )}
        </div>
        <div>
          <h5 className="mb-2 font-semibold">System-Daten:</h5>
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
                <LinkExternal blank href={viewerUrl} className="scale-75">
                  Viewer
                </LinkExternal>
              </>
            )}
          </p>
          {systemProperties.length ? (
            systemProperties.map(([key, value]) => {
              return (
                <p key={key} className="mb-0.5 border-b border-gray-200 pb-0.5">
                  <code title={`${value} is a ${typeof value}`}>
                    {key}: {typeof value === 'boolean' ? JSON.stringify(value) : value}{' '}
                  </code>
                </p>
              )
            })
          ) : (
            <p>./.</p>
          )}
          {feature.properties.updated_at && (
            <p className="mt-3">
              <strong className="font-semibold">Letzte Änderung:</strong>
              <br />
              {format(fromUnixTime(Number(feature.properties.updated_at)), 'dd.MM.yyyy HH:mm:ss', {
                locale: de,
              })}
              <br />
              {formatDistanceToNow(fromUnixTime(Number(feature.properties.updated_at)), {
                addSuffix: true,
                locale: de,
              })}
            </p>
          )}
        </div>
      </div>
    </details>
  )
}
