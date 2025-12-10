import { LinkExternal } from '@/src/app/_components/links/LinkExternal'
import { isProd } from '@/src/app/_components/utils/isEnv'
import { useMapParam } from '@/src/app/regionen/[regionSlug]/_hooks/useQueryState/useMapParam'
import {
  MapDataOsmIdConfig,
  MapDataSourceInspectorEditor,
} from '@/src/app/regionen/[regionSlug]/_mapData/types'
import { Fragment } from 'react'
import { InspectorFeature } from '../Inspector'
import { editorUrl } from './osmUrls/editorUrl'
import { extractOsmTypeIdByConfig } from './osmUrls/extractOsmTypeIdByConfig'
import {
  historyUrl,
  mapillaryUrl,
  osmEditIdUrl,
  osmEditJosmUrl,
  osmEditKyleKiwiIdUrl,
  osmEditRapidUrl,
  osmOrgUrl,
} from './osmUrls/osmUrls'
import { ToolsLinkNewInternalNote } from './ToolsLinkNewInternalNote'
import { ToolsLinkNewOsmNote } from './ToolsLinkNewOsmNote'

type Props = {
  feature: InspectorFeature['feature']
  editors?: MapDataSourceInspectorEditor[]
  osmIdConfig?: MapDataOsmIdConfig
}

export const ToolsLinks = ({ feature, editors, osmIdConfig }: Props) => {
  const { mapParam } = useMapParam()
  const osmTypeId = extractOsmTypeIdByConfig(feature.properties, osmIdConfig)

  const osmUrlHref = osmOrgUrl(osmTypeId)
  const osmEditIdUrlHref = osmEditIdUrl(osmTypeId)
  const osmEditJosmUrlHref = osmEditJosmUrl(osmTypeId)
  const osmEditKyleKiwiIdUrlHref = osmEditKyleKiwiIdUrl(osmTypeId)
  const osmEditRapidUrlHref = osmEditRapidUrl(osmTypeId)
  const mapillaryUrlHref = mapillaryUrl(feature.geometry, { zoom: mapParam.zoom })

  const changesetLinks = [
    {
      title: 'Änderungshistorie',
      url: historyUrl(osmTypeId),
    },
    {
      title: 'Changeset',
      url:
        Boolean(feature.properties.changeset_id) &&
        `https://www.openstreetmap.org/changeset/${feature.properties.changeset_id}`,
    },
    {
      title: 'OSMCha',
      url:
        Boolean(feature.properties.changeset_id) &&
        `https://osmcha.org/changesets/${feature.properties.changeset_id}`,
    },
  ]

  return (
    <section className="pb-1 text-xs">
      <div className="flex flex-wrap gap-3">
        {editors?.map(({ urlTemplate, name, idKey }) => {
          const url = editorUrl({
            urlTemplate,
            geometry: feature.geometry,
            osmTypeId,
            editorId: idKey && feature.properties[idKey],
          })
          if (!url) return null
          return (
            <LinkExternal key={name} blank button href={url}>
              {name}
            </LinkExternal>
          )
        })}
        {osmUrlHref && (
          <LinkExternal blank button href={osmUrlHref}>
            OpenStreetMap
          </LinkExternal>
        )}
        {osmEditIdUrlHref && (
          <LinkExternal blank button href={osmEditIdUrlHref}>
            Bearbeiten (iD)
          </LinkExternal>
        )}
        {osmEditJosmUrlHref && (
          <LinkExternal blank button href={osmEditJosmUrlHref}>
            JOSM
          </LinkExternal>
        )}
        {osmEditKyleKiwiIdUrlHref && (
          <LinkExternal blank button href={osmEditKyleKiwiIdUrlHref}>
            kiwiD
          </LinkExternal>
        )}
        {/* Just for testing for now… */}
        {!isProd && osmEditRapidUrlHref && (
          <LinkExternal blank button href={osmEditRapidUrlHref}>
            Bearbeiten (Rapid) (Staging only)
          </LinkExternal>
        )}
        {mapillaryUrlHref && (
          <LinkExternal blank button href={mapillaryUrlHref}>
            Mapillary
          </LinkExternal>
        )}
        <ToolsLinkNewOsmNote
          properties={feature.properties}
          geometry={feature.geometry}
          osmIdConfig={osmIdConfig}
        />
        <ToolsLinkNewInternalNote
          properties={feature.properties}
          geometry={feature.geometry}
          osmIdConfig={osmIdConfig}
        />
      </div>

      <div className="mt-3">
        {changesetLinks.map(({ title, url }) => {
          if (!url) return null
          return (
            <Fragment key={url}>
              <LinkExternal blank href={url}>
                {title}
              </LinkExternal>
              <span className="last:hidden"> &bull; </span>
            </Fragment>
          )
        })}
      </div>

      {feature.properties.geom_sources === feature.properties.tag_sources ? (
        <OsmSources idString={feature.properties.geom_sources} title="OpenStreetMap" />
      ) : (
        <>
          <OsmSources idString={feature.properties.geom_sources} title="OpenStreetMap (Geometry)" />
          <OsmSources idString={feature.properties.tag_sources} title="OpenStreetMap (Tags)" />
        </>
      )}
    </section>
  )
}

type OsmSourcesProps = {
  idString: string | undefined
  title: string
}

const OsmSources = ({ idString, title }: OsmSourcesProps) => {
  if (!idString) return null

  const sourceIds = idString
    .split(';')
    .map((id) => id.trim())
    .filter(Boolean)

  if (sourceIds.length === 0) return null

  return (
    <div className="mt-3">
      <span className="text-gray-600">{title}: </span>
      {sourceIds.map((id, index) => {
        const osmTypeId = extractOsmTypeIdByConfig({ id }, { osmTypeId: 'id' })
        const osmUrlHref = osmOrgUrl(osmTypeId)

        if (!osmUrlHref) return null

        return (
          <Fragment key={id}>
            <LinkExternal blank href={osmUrlHref}>
              {id}
            </LinkExternal>
            {index < sourceIds.length - 1 && ', '}
          </Fragment>
        )
      })}
    </div>
  )
}
