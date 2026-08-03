import { createHash } from 'node:crypto'
import { faker } from '@faker-js/faker'
import { isOsmPlaceholderEmail } from '@/components/shared/utils/osmPlaceholderEmail'

export function isFixMyCityEmail(email: string) {
  return email.toLowerCase().endsWith('@fixmycity.de')
}

function seedNumberFromUserId(userId: string) {
  const digest = createHash('sha256').update(userId).digest()
  return digest.readUInt32BE(0)
}

function slugPart(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 24)
}

/** Deterministic contact fields for a restored non-FixMyCity user. Keeps id/osmId untouched. */
export function buildPseudonymForUser(userId: string) {
  faker.seed(seedNumberFromUserId(userId))
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  const suffix =
    userId
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(-8)
      .toLowerCase() || 'user'
  const local = [slugPart(firstName) || 'user', slugPart(lastName) || 'anon', suffix].join('.')
  return {
    firstName,
    lastName,
    email: `${local}@example.invalid`,
  }
}

export function shouldPseudonymizeContactEmail(email: string) {
  return !isFixMyCityEmail(email) && !isOsmPlaceholderEmail(email)
}

export function shouldPseudonymizeNames(email: string) {
  return !isFixMyCityEmail(email)
}
