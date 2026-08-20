import { describe, expect, it } from 'vitest'
import { assertDumpContainsOnlyTable, parsePgRestoreToc } from './parsePgRestoreToc'

/** Verbatim-style `pg_restore --list` for a `pg_dump -Fc` of an ogr2ogr-created table. */
const realisticOgrToc = `
;
; Archive created at 2026-08-12 12:00:00 UTC
;     dbname: postgres
;     TOC Entries: 9
;     Compression: -1
;     Dump Version: 1.15-0
;     Format: CUSTOM
;     Integer: 4 bytes
;     Offset: 8 bytes
;     Dumped from database version: 17.4
;     Dumped by pg_dump version: 17.4
;
;
; Selected TOC Entries:
;
2341; 1259 18420 TABLE data euvm_cutouts_point postgres
2342; 0 0 SEQUENCE data euvm_cutouts_point_id_seq postgres
2343; 0 0 SEQUENCE OWNED BY data euvm_cutouts_point.id postgres
2344; 0 18420 TABLE DATA data euvm_cutouts_point postgres
2345; 0 0 SEQUENCE SET data euvm_cutouts_point_id_seq postgres
2346; 2604 18421 DEFAULT data euvm_cutouts_point id postgres
2347; 1259 18422 INDEX data euvm_cutouts_point_geom_idx postgres
2348; 2606 18423 CONSTRAINT data euvm_cutouts_point euvm_cutouts_point_pkey postgres
2349; 0 0 COMMENT data euvm_cutouts_point postgres
`

const minimalTableToc = `
1234; 1259 16400 TABLE data euvm_cutouts_point postgres
1235; 0 16400 TABLE DATA data euvm_cutouts_point postgres
1236; 1259 16401 INDEX data euvm_cutouts_point_geom_idx postgres
1237; 2606 16402 CONSTRAINT data euvm_cutouts_point euvm_cutouts_point_pkey postgres
`

describe('parsePgRestoreToc', () => {
  it('parses TABLE, TABLE DATA, INDEX, CONSTRAINT entries', () => {
    const entries = parsePgRestoreToc(minimalTableToc)
    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          desc: 'TABLE',
          schema: 'data',
          name: 'euvm_cutouts_point',
        }),
        expect.objectContaining({
          desc: 'TABLE DATA',
          schema: 'data',
          name: 'euvm_cutouts_point',
        }),
        expect.objectContaining({
          desc: 'INDEX',
          schema: 'data',
          name: 'euvm_cutouts_point_geom_idx',
        }),
        expect.objectContaining({
          desc: 'CONSTRAINT',
          schema: 'data',
          name: 'euvm_cutouts_point',
          objectName: 'euvm_cutouts_point_pkey',
        }),
      ]),
    )
  })

  it('parses SEQUENCE SET before SEQUENCE and handles empty owner', () => {
    const toc = `
10; 0 0 SEQUENCE SET data euvm_cutouts_point_id_seq
11; 0 0 SEQUENCE data euvm_cutouts_point_id_seq
`
    const entries = parsePgRestoreToc(toc)
    expect(entries).toEqual([
      expect.objectContaining({
        desc: 'SEQUENCE SET',
        schema: 'data',
        name: 'euvm_cutouts_point_id_seq',
      }),
      expect.objectContaining({
        desc: 'SEQUENCE',
        schema: 'data',
        name: 'euvm_cutouts_point_id_seq',
      }),
    ])
  })

  it('emits an unparseable entry for garbage TOC lines', () => {
    const entries = parsePgRestoreToc('not-a-toc-line at all\n')
    expect(entries).toEqual([expect.objectContaining({ unparseable: true, desc: 'UNPARSEABLE' })])
  })

  it('parses a realistic ogr2ogr single-table dump TOC', () => {
    const entries = parsePgRestoreToc(realisticOgrToc)
    expect(entries.map((e) => e.desc)).toEqual([
      'TABLE',
      'SEQUENCE',
      'SEQUENCE OWNED BY',
      'TABLE DATA',
      'SEQUENCE SET',
      'DEFAULT',
      'INDEX',
      'CONSTRAINT',
      'COMMENT',
    ])
  })
})

describe('assertDumpContainsOnlyTable', () => {
  it('accepts a well-formed single-table TOC', () => {
    expect(() => assertDumpContainsOnlyTable(minimalTableToc, 'euvm_cutouts_point')).not.toThrow()
  })

  it('accepts a realistic ogr2ogr single-table dump TOC', () => {
    expect(() => assertDumpContainsOnlyTable(realisticOgrToc, 'euvm_cutouts_point')).not.toThrow()
  })

  it('rejects a TOC containing another table', () => {
    const toc = `${minimalTableToc}
1238; 1259 16410 TABLE data other_table postgres
`
    expect(() => assertDumpContainsOnlyTable(toc, 'euvm_cutouts_point')).toThrow(/other_table/)
  })

  it('rejects a TOC containing another schema', () => {
    const toc = `
100; 1259 1 TABLE public euvm_cutouts_point postgres
`
    expect(() => assertDumpContainsOnlyTable(toc, 'euvm_cutouts_point')).toThrow(/public/)
  })

  it('rejects CONSTRAINT on a different table', () => {
    const toc = `
10; 1259 1 TABLE data euvm_cutouts_point postgres
11; 2606 2 CONSTRAINT data other_table other_table_pkey postgres
`
    expect(() => assertDumpContainsOnlyTable(toc, 'euvm_cutouts_point')).toThrow(/other_table/)
  })

  it('rejects a TOC containing a FUNCTION', () => {
    const toc = `
10; 1259 1 TABLE data euvm_cutouts_point postgres
11; 1255 2 FUNCTION public evil() postgres
`
    expect(() => assertDumpContainsOnlyTable(toc, 'euvm_cutouts_point')).toThrow(/FUNCTION/)
  })

  it('rejects a TOC containing a TRIGGER', () => {
    const toc = `
10; 1259 1 TABLE data euvm_cutouts_point postgres
11; 2620 2 TRIGGER data euvm_cutouts_point evil_trig postgres
`
    expect(() => assertDumpContainsOnlyTable(toc, 'euvm_cutouts_point')).toThrow(/TRIGGER/)
  })

  it('rejects a TOC containing an ACL', () => {
    const toc = `
10; 1259 1 TABLE data euvm_cutouts_point postgres
11; 0 0 ACL data euvm_cutouts_point postgres
`
    expect(() => assertDumpContainsOnlyTable(toc, 'euvm_cutouts_point')).toThrow(/ACL/)
  })

  it('rejects an INDEX belonging to a different table', () => {
    const toc = `
10; 1259 1 TABLE data euvm_cutouts_point postgres
11; 1259 2 INDEX data other_table_geom_idx postgres
`
    expect(() => assertDumpContainsOnlyTable(toc, 'euvm_cutouts_point')).toThrow(
      /other_table_geom_idx/,
    )
  })

  it('rejects an unparseable TOC line', () => {
    const toc = `
10; 1259 1 TABLE data euvm_cutouts_point postgres
this line is garbage
`
    expect(() => assertDumpContainsOnlyTable(toc, 'euvm_cutouts_point')).toThrow(/unparseable/i)
  })
})
