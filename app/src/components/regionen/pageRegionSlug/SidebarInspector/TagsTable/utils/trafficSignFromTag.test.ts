import { describe, expect, test } from 'vitest'
import { parseTrafficSignTag } from './trafficSignFromTag'

describe('parseTrafficSignTag', () => {
  test('parses comma-separated sign codes with redirects and bundled SVGs', () => {
    const items = parseTrafficSignTag('DE:244.1,1020-30')
    expect(items).toHaveLength(2)
    expect(items?.[0]).toMatchObject({
      recognized: true,
      label: 'Fahrradstraße',
      key: '244.1',
    })
    expect(items?.[0]?.svgName).toBe('DE_244_1')
    expect(items?.[1]).toMatchObject({
      recognized: true,
      label: 'Anlieger frei',
      key: '1020-30',
      svgName: 'DE_1020_30',
    })
  })

  test('redirects 244 to 244.1', () => {
    const items = parseTrafficSignTag('DE:244,1020-30')
    expect(items?.[0]).toMatchObject({
      recognized: true,
      label: 'Fahrradstraße',
      key: '244.1',
    })
    expect(items?.[0]?.svgName).toBe('DE_244_1')
  })

  test('redirects 274.1[30] to 274.1', () => {
    const items = parseTrafficSignTag('DE:274.1[30]')
    expect(items).toHaveLength(1)
    expect(items?.[0]).toMatchObject({
      recognized: true,
      label: 'Tempo 30-Zone',
      key: '274.1',
      svgName: 'DE_274_1',
    })
  })

  test('passes through quoted supplementary text from the package as-is', () => {
    const items = parseTrafficSignTag('DE:244.1,"Zufahrt bis Dieffenbachstraße frei"')
    expect(items).toHaveLength(2)
    expect(items?.[0]?.recognized).toBe(true)
    expect(items?.[1]).toMatchObject({
      recognized: false,
      key: '"Zufahrt bis Dieffenbachstraße frei"',
      label: '"Zufahrt bis Dieffenbachstraße frei"',
      svgName: null,
    })
  })

  test('splits on semicolon outside quotes', () => {
    const items = parseTrafficSignTag(
      'DE:250,"Radfahrer,Taxi,Gespannfuhrwerke und Anlieger zu den Grundstücken Unter den Linden und Pariser Platz Frei";DE:274.1[30]',
    )
    expect(items).toHaveLength(3)
    expect(items?.[0]?.label).toBeTruthy()
    expect(items?.[2]).toMatchObject({
      recognized: true,
      label: 'Tempo 30-Zone',
    })
  })

  test('preserves slashes in free-text signs', () => {
    const items = parseTrafficSignTag('Rad/Fuß: Fußgänger haben Vorrang.')
    expect(items).toHaveLength(1)
    expect(items?.[0]).toMatchObject({
      recognized: false,
      label: 'Rad/Fuß: Fußgänger haben Vorrang.',
      key: 'Rad/Fuß: Fußgänger haben Vorrang.',
    })
  })

  test('handles multiple quoted free-text segments', () => {
    const items = parseTrafficSignTag(
      '"Geschützt Grünanlage","Radfahren erlaubt Fußgänger haben Vorrang!"',
    )
    expect(items).toHaveLength(2)
    expect(items?.[0]?.key).toBe('"Geschützt Grünanlage"')
    expect(items?.[1]?.key).toBe('"Radfahren erlaubt Fußgänger haben Vorrang!"')
  })

  test('handles mixed sign codes and quoted text', () => {
    const items = parseTrafficSignTag('street_name_sign;DE:220-10;DE:1000-32;"Gehwegschäden"')
    expect(items).toHaveLength(4)
    expect(items?.[1]).toMatchObject({
      recognized: true,
      label: 'Einbahnstraße – linksweisend',
    })
    expect(items?.[1]?.svgName).toBe('DE_220_10')
    expect(items?.[3]?.label).toBe('Gehwegschäden')
  })

  test('recognizes Radschnellweg 350.1', () => {
    const items = parseTrafficSignTag('DE:350.1')
    expect(items?.[0]).toMatchObject({
      recognized: true,
      label: 'Radschnellweg',
      key: '350.1',
      svgName: 'DE_350_1',
    })
  })

  test('redirects generic 241 to 241-30', () => {
    const items = parseTrafficSignTag('DE:241')
    expect(items?.[0]).toMatchObject({
      recognized: true,
      label: 'Getrennter Rad- und Gehweg',
      key: '241-30',
      svgName: 'DE_241_30',
    })
  })
})
