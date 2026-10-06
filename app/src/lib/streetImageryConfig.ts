import {
  createStreetImageryConfig,
  registerProviderAdapters,
  setStreetImageryConfig,
} from '@osm-editor-kit/street-imagery'
import { mapillaryAdapter } from '@osm-editor-kit/street-imagery/providers/mapillary'
import { panoramaxAdapter } from '@osm-editor-kit/street-imagery/providers/panoramax'
import { apiKeyMapillary } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/apiKeys.const'
import { infra3dProjects } from '@/components/regionen/pageRegionSlug/SidebarInspector/Tools/imageryLinks.const'

// One-time setup of `@osm-editor-kit/street-imagery`, imported once in `router.tsx`. The package
// keeps one config for the whole app and reads it when it builds a link:
// - `mapillaryToken` is for Mapillary's tiles and API (map layers, the link to the nearest photo).
// - `infra3d.projects` are the infra3D links it offers (it knows no projects of its own).
setStreetImageryConfig(
  createStreetImageryConfig({
    mapillaryToken: apiKeyMapillary,
    infra3d: { projects: infra3dProjects },
  }),
)

// The providers that can show photos on the map. Only these are bundled.
registerProviderAdapters([mapillaryAdapter, panoramaxAdapter])
