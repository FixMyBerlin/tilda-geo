import { LinkExternal } from '@/src/app/_components/links/LinkExternal'
import { isProd } from '@/src/app/_components/utils/isEnv'
import {
  MapDataOsmIdConfig,
  MapDataSourceInspectorEditor,
} from '@/src/app/regionen/[regionSlug]/_mapData/types'
import { InspectorFeature } from '../Inspector'
import { editorUrl } from './osmUrls/editorUrl'
import { extractOsmTypeIdByConfig } from './osmUrls/extractOsmTypeIdByConfig'
import {
  historyUrl,
  mapillaryUrl,
  osmEditIdUrl,
  osmEditRapidUrl,
  osmOrgUrl,
} from './osmUrls/osmUrls'
import { ToolsLinkNewAtlasNote } from './ToolsLinkNewAtlasNote'
import { ToolsLinkNewOsmNote } from './ToolsLinkNewOsmNote'

type Props = {
  feature: InspectorFeature['feature']
  editors?: MapDataSourceInspectorEditor[]
  osmIdConfig?: MapDataOsmIdConfig
}

export const ToolsLinks = ({ feature, editors, osmIdConfig }: Props) => {
  const osmTypeId = extractOsmTypeIdByConfig(feature.properties, osmIdConfig)

  const osmUrlHref = osmOrgUrl(osmTypeId)
  const osmEditIdUrlHref = osmEditIdUrl(osmTypeId)
  const osmEditRapidUrlHref = osmEditRapidUrl(osmTypeId)
  const mapillaryUrlHref = mapillaryUrl(feature.geometry)

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
    <section className="flex flex-wrap gap-3 pb-1 text-xs">
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
      <ToolsLinkNewAtlasNote
        properties={feature.properties}
        geometry={feature.geometry}
        osmIdConfig={osmIdConfig}
      />

      <div>
        {changesetLinks.map(({ title, url }) => {
          if (!url) return null
          return (
            <>
              <LinkExternal key={url} blank href={url}>
                {title}
              </LinkExternal>
              <span className="last:hidden"> &bull; </span>
            </>
          )
        })}
      </div>
    </section>
  )
}
