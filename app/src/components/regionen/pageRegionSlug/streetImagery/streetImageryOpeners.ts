import { imageryOpenerIds } from '../SidebarInspector/Tools/imageryLinks.const'
import { streetImageryProviderIds } from './streetImageryParam'

const providerIds: readonly string[] = streetImageryProviderIds

/**
 * Services that can only be opened at a place (Google Street View, Apple Look Around, infra3D).
 * Mapillary and Panoramax are not among them: their photos are on the map.
 */
export const streetImageryOpenerIds = imageryOpenerIds.filter((id) => !providerIds.includes(id))
