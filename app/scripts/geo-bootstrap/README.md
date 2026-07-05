# Geo bootstrap

Maintainer notes for the minimal processing run invoked from [`prisma/seed.ts`](../../prisma/seed.ts) on local seed (~30s with cached PBF).

Flags: [`flags.ts`](flags.ts). Implementation: [`run.ts`](run.ts).

## App vs processing boundary

| Owner                              | Responsibility                                                                            |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| **Processing** (`processing/`)     | Create/migrate `public.meta`, write run rows, create all geo/tile tables in `public`      |
| **App seed** (`app/prisma/seeds/`) | Dummy Prisma data + dev-only fake `public.meta` **rows** (insert only — table must exist) |
| **App runtime**                    | Read `public.meta`; tolerate null when no row yet; never create geo tables                |
