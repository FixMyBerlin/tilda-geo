import type { Prisma } from '@/prisma/generated/client'

/** Stable FMC admin identities for fresh seed and post-db-pull local-access seed. */
export const FMC_ADMIN_USERS = [
  {
    osmId: 11881,
    osmName: 'tordans',
    osmDescription: undefined,
    role: 'ADMIN',
    email: 'tobias@fixmycity.de',
    firstName: 'Tobias',
    lastName: 'Jordans',
  },
  {
    osmId: 418040,
    osmName: 'Supaplex030',
    osmDescription: undefined,
    role: 'ADMIN',
    email: 'alex@fixmycity.de',
    firstName: 'Alex',
    lastName: '',
  },
  {
    // On master.apis.dev.openstreetmap.org
    osmId: 6501,
    osmName: 'tordansdev',
    osmDescription: undefined,
    role: 'ADMIN',
    email: 'tobias+osmdev@fixmycity.de',
    firstName: 'Tobias',
    lastName: 'Jordans',
  },
] as const satisfies Prisma.UserUncheckedCreateInput[]

/** Owner of the deterministic local-dev MCP AdminApiToken. */
export const LOCAL_DEV_MCP_TOKEN_OWNER_OSM_ID = 11881 as const
