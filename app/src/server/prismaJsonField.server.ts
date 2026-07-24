import { Prisma } from '@/prisma/generated/client'

/**
 * Prisma `Json?` write helper. Plain `null`/`undefined` is rejected by Prisma for Json columns —
 * map them to `JsonNull` (JSON `null`). Prefer this over `DbNull` for nullable Json fields so
 * writes match the existing Region bbox/cacheWarming convention.
 */
export function prismaJsonField(value: unknown) {
  return value == null ? Prisma.JsonNull : value
}
