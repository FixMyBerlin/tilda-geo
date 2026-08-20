import { describe, expect, it } from 'vitest'
import { pickFolderSourceFile } from './sourceFile'

describe('pickFolderSourceFile', () => {
  it('uses spec.source.file when that file is in the folder', () => {
    expect(
      pickFolderSourceFile({
        table: 'euvm_cutouts_point',
        specFile: 'euvm_cutouts_point.geojson',
        files: ['euvm_cutouts_point.geojson', 'notes.txt'],
      }),
    ).toBe('euvm_cutouts_point.geojson')
  })

  it('uses the only .geojson/.gpkg when spec.source.file is missing', () => {
    expect(
      pickFolderSourceFile({
        table: 'euvm_cutouts_point',
        specFile: 'euvm_cutouts_point.geojson',
        files: ['delivery.gpkg', 'spec.yaml'],
      }),
    ).toBe('delivery.gpkg')
  })

  it('ignores spec.yaml and other non-source files', () => {
    expect(
      pickFolderSourceFile({
        table: 'euvm_cutouts_point',
        specFile: 'missing.geojson',
        files: ['spec.yaml', 'data.dump', 'cutouts.geojson'],
      }),
    ).toBe('cutouts.geojson')
  })

  it('errors when the folder has no source file', () => {
    expect(() =>
      pickFolderSourceFile({
        table: 'euvm_cutouts_point',
        specFile: 'euvm_cutouts_point.geojson',
        files: ['spec.yaml'],
      }),
    ).toThrow(/No \.geojson or \.gpkg/)
  })

  it('errors when several source files exist and spec.source.file is not among them', () => {
    expect(() =>
      pickFolderSourceFile({
        table: 'euvm_cutouts_point',
        specFile: 'euvm_cutouts_point.geojson',
        files: ['a.geojson', 'b.gpkg'],
      }),
    ).toThrow(/Several source files/)
  })
})
