import { Fragment } from 'react'
import type {
  MapDataOsmIdConfig,
  MapDataSourceInspectorEditor,
} from '@/components/regionen/pageRegionSlug/mapData/types'
import { Link } from '@/components/shared/links/Link'
import {
  routeRelationShortTitle,
  routeRelationsKey,
  routeRelationTitle,
} from '../../routeRelations/routeRelations'
import { useRouteRelations } from '../../routeRelations/useRouteRelations'
import type { InspectorFeature } from '../Inspector'
import { editorUrl } from './osmUrls/editorUrl'
import { extractOsmTypeIdByConfig } from './osmUrls/extractOsmTypeIdByConfig'
import { historyUrl, osmEditIdUrl, osmEditJosmUrl, osmOrgUrl } from './osmUrls/osmUrls'
import { ToolsLinkNewInternalNote } from './ToolsLinkNewInternalNote'
import { ToolsLinkNewOsmNote } from './ToolsLinkNewOsmNote'
import { ToolsLinksImagery } from './ToolsLinksImagery'

type ToolsLinksProps = {
  feature: InspectorFeature['feature']
  editors?: MapDataSourceInspectorEditor[]
  osmIdConfig?: MapDataOsmIdConfig
}

export const ToolsLinks = ({ feature, editors, osmIdConfig }: ToolsLinksProps) => {
  const osmTypeId = extractOsmTypeIdByConfig(feature.properties, osmIdConfig)

  const osmUrlHref = osmOrgUrl(osmTypeId)
  const osmEditIdUrlHref = osmEditIdUrl(osmTypeId)
  const osmEditJosmUrlHref = osmEditJosmUrl(osmTypeId)
  const routeRelationLinks = useRouteRelations(
    feature.properties[routeRelationsKey],
  ).routes.flatMap(({ relations }) =>
    relations.map(({ relationId, detail }) => ({
      label: routeRelationShortTitle(relationId, detail),
      // Both directions of a bus line share the ref; the full title tells them apart.
      title: routeRelationTitle(relationId, detail),
      url: `${osmOrgUrl({ osmType: 'relation', osmId: relationId })}/history`,
    })),
  )
  // const osmEditKyleKiwiIdUrlHref = osmEditKyleKiwiIdUrl(osmTypeId)
  // const osmEditRapidUrlHref = osmEditRapidUrl(osmTypeId)

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
            <Link key={name} blank button href={url}>
              {name}
            </Link>
          )
        })}
        {osmUrlHref && (
          <Link blank button href={osmUrlHref}>
            OpenStreetMap
          </Link>
        )}
        {osmEditIdUrlHref && (
          <Link blank button href={osmEditIdUrlHref}>
            Bearbeiten (iD)
          </Link>
        )}
        {osmEditJosmUrlHref && (
          <Link blank button href={osmEditJosmUrlHref}>
            JOSM
          </Link>
        )}
        {/* {osmEditKyleKiwiIdUrlHref && (
          <Link blank button href={osmEditKyleKiwiIdUrlHref}>
            kiwiD
          </Link>
        )} */}
        {/* {!isProd && osmEditRapidUrlHref && (
          <Link blank button href={osmEditRapidUrlHref}>
            Bearbeiten (Rapid) (Staging only)
          </Link>
        )} */}
        <ToolsLinksImagery geometry={feature.geometry} />
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
              <Link blank href={url}>
                {title}
              </Link>
              <span className="last:hidden"> &bull; </span>
            </Fragment>
          )
        })}
      </div>

      {routeRelationLinks.length > 0 && (
        <div className="mt-3">
          <span className="text-gray-600">Routen: </span>
          {routeRelationLinks.map(({ label, title, url }, index) => (
            <Fragment key={url}>
              <Link blank href={url} title={title}>
                {label}
              </Link>
              {index < routeRelationLinks.length - 1 && ', '}
            </Fragment>
          ))}
        </div>
      )}

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
            <Link blank href={osmUrlHref}>
              {id}
            </Link>
            {index < sourceIds.length - 1 && ', '}
          </Fragment>
        )
      })}
    </div>
  )
}
