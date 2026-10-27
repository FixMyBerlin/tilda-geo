import type { LineString } from 'geojson'
import { describe, expect, test } from 'vitest'
import type { TodoId } from '@/data/processingTypes/todoId.generated.const'
import { campaigns } from '@/data/radinfra-de/campaigns'
import { buildTaskInstructions } from './buildTaskInstructions'

const geometry: LineString = {
  type: 'LineString',
  coordinates: [
    [13.4, 52.5],
    [13.41, 52.51],
  ],
}

const build = (projectKey: string, kind: string) =>
  buildTaskInstructions({
    projectKey: projectKey as TodoId,
    osmTypeIdString: 'way/123',
    kind,
    geometry,
  })

describe('buildTaskInstructions()', () => {
  test.each(campaigns.map((campaign) => campaign.id))('replaces all placeholders for %s', (id) => {
    expect(build(id, 'cyclewayOnHighway_exclusive')).not.toMatch(/%%[A-Z_]+%%/)
  })

  test('uses the bikelane category label', () => {
    expect(build('adjoining_or_isolated', 'cyclewayOnHighway_exclusive')).toContain(
      'Für diese Infrastruktur (Radfahrstreifen) fehlt',
    )
  })

  test('removes the "Kategorisierung unklar" suffixes', () => {
    expect(build('adjoining_or_isolated', 'cycleway_adjoiningOrIsolated')).toContain(
      'Für diese Infrastruktur (Radweg) fehlt',
    )
    expect(build('adjoining_or_isolated', 'cyclewayOnHighway_advisoryOrExclusive')).toContain(
      'Für diese Infrastruktur (Radfahrstreifen oder Schutzstreifen) fehlt',
    )
  })

  test('uses the road class label without soft hyphens', () => {
    expect(build('adjoining_or_isolated', 'secondary')).toContain(
      'Für diese Infrastruktur (Landesstraße/Wichtige Durchgangsstraße) fehlt',
    )
  })
})
