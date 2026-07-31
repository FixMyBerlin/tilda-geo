import { describe, expect, test } from 'vitest'
import {
  isOsmPlaceholderEmail,
  osmPlaceholderEmail,
} from '@/components/shared/utils/osmPlaceholderEmail'
import {
  buildPseudonymForUser,
  isFixMyCityEmail,
  shouldPseudonymizeContactEmail,
  shouldPseudonymizeNames,
} from './pseudonymizeUser'

describe('isFixMyCityEmail', () => {
  test('matches fixmycity.de', () => {
    expect(isFixMyCityEmail('tobias@fixmycity.de')).toBe(true)
    expect(isFixMyCityEmail('Alex@FixMyCity.de')).toBe(true)
  })

  test('rejects other domains', () => {
    expect(isFixMyCityEmail('a@example.com')).toBe(false)
    expect(isFixMyCityEmail(osmPlaceholderEmail(1))).toBe(false)
  })
})

describe('buildPseudonymForUser', () => {
  test('is deterministic for a given user id', () => {
    const a = buildPseudonymForUser('clxuser00000000000000001')
    const b = buildPseudonymForUser('clxuser00000000000000001')
    expect(a).toEqual(b)
    expect(a.email.endsWith('@example.invalid')).toBe(true)
    expect(a.firstName.length).toBeGreaterThan(0)
    expect(a.lastName.length).toBeGreaterThan(0)
  })

  test('differs across user ids', () => {
    const a = buildPseudonymForUser('clxuser00000000000000001')
    const b = buildPseudonymForUser('clxuser00000000000000002')
    expect(a.email).not.toBe(b.email)
  })

  test('uses an example.invalid address with a stable id suffix', () => {
    const pseudo = buildPseudonymForUser('cluserabcdefghijklmnop')
    expect(pseudo.email.endsWith('@example.invalid')).toBe(true)
    expect(pseudo.email.endsWith('.ijklmnop@example.invalid')).toBe(true)
  })
})

describe('pseudonymize rules', () => {
  test('contact email: rewrite external, keep FMC and OSM placeholders', () => {
    expect(shouldPseudonymizeContactEmail('person@gmail.com')).toBe(true)
    expect(shouldPseudonymizeContactEmail('tobias@fixmycity.de')).toBe(false)
    expect(shouldPseudonymizeContactEmail(osmPlaceholderEmail(42))).toBe(false)
  })

  test('names: rewrite non-FMC including OSM-placeholder users', () => {
    expect(shouldPseudonymizeNames('person@gmail.com')).toBe(true)
    expect(shouldPseudonymizeNames(osmPlaceholderEmail(42))).toBe(true)
    expect(shouldPseudonymizeNames('tobias@fixmycity.de')).toBe(false)
  })

  test('OSM placeholder detection still works on kept emails', () => {
    expect(isOsmPlaceholderEmail(osmPlaceholderEmail(9))).toBe(true)
  })
})
