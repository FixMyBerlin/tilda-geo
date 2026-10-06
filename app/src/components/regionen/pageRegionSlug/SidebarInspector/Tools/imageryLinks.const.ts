import type { Infra3dProject } from '@osm-editor-kit/street-imagery'

/**
 * The infra3D projects we link to. A feature inside a project's `bbox` gets its link, in every
 * region; infra3D asks for a login, so the link has a lock icon.
 *
 * TEMPORARY WORKAROUND: hard-coded. Options to improve it:
 * - Show the link only to regions that have access: an `infra3dProjectUids` field on `Region`,
 *   set in the admin. Today the locked link also shows in Germany-wide regions.
 * - The outline of the area instead of the bbox, which also covers a rim of Brandenburg.
 */
export const infra3dProjects: Infra3dProject[] = [
  {
    uid: 'ec2428b7-8e49-4d93-80a0-edfec6da1cf3',
    label: 'infra3D Berlin',
    bbox: [13.08, 52.33, 13.77, 52.68],
  },
]

/** The services we link to, in this order; the infra3D projects come last. */
export const imageryOpenerIds: string[] = [
  'mapillary',
  'panoramax',
  'streetview',
  'lookaround',
  ...infra3dProjects.map((project) => `infra3d:${project.uid}`),
]

/** The Mapillary link shows photos of the last years only, like the Mapillary layers. */
export const imageryMaxAgeYears = 3
