import { createStreetImageryConfig, setStreetImageryConfig } from '@osm-editor-kit/street-imagery'
import { apiKeyMapillary } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/apiKeys.const'
import { infra3dProjects } from '@/components/regionen/pageRegionSlug/SidebarInspector/Tools/imageryLinks.const'

// One-time setup of `@osm-editor-kit/street-imagery`, imported once in `router.tsx`. The package
// keeps one config for the whole app and reads it when it builds a link:
// - `mapillaryToken` lets the Mapillary link look up the nearest photo, turned to the feature.
// - `infra3d.projects` are the infra3D links it offers (it knows no projects of its own).
setStreetImageryConfig(
  createStreetImageryConfig({
    mapillaryToken: apiKeyMapillary,
    infra3d: { projects: infra3dProjects },
  }),
)
