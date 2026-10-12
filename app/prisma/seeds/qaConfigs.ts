import db from '../../src/server/db.server'
import { qaDatasets } from '../../src/server/qa-configs/qaDatasets.const'

const seedQaConfigs = async () => {
  const parkraumRegion = await db.region.findFirstOrThrow({
    where: { slug: 'dev-template-parkraum-city' },
  })

  await db.qaConfig.create({
    data: {
      slug: 'dev-parkraum-qa-2025',
      label: 'Parkraum QA (Dev)',
      isActive: true,
      mapTable: 'public.qa_parkings_euvm',
      mapAttribution: 'QA Data: tilda-geo.de',
      dataset: 'parking_euvm',
      areaTable: 'data.euvm_qa_voronoi_2026',
      areaFilter: 'all',
      referenceTable: 'data.qa_parkings_euvm_reference_2026',
      indicators: qaDatasets.parking_euvm.defaultIndicators,
      regionId: parkraumRegion.id,
      referenceFrozenAt: new Date('2025-06-30'),
    },
  })

  const radinfraRegion = await db.region.findFirst({ where: { slug: 'radinfra' } })
  if (!radinfraRegion) {
    console.log('⚠️ Skipping bikelanes QA config seed - region "radinfra" not found')
    return
  }

  await db.qaConfig.create({
    data: {
      slug: 'radinfra-berlin-2026',
      label: 'Radinfrastruktur Berlin 2026',
      isActive: true,
      mapTable: 'public.qa_bikelanes_berlin',
      mapAttribution: 'QA Data: tilda-geo.de',
      dataset: 'bikelanes',
      areaTable: 'data.euvm_qa_voronoi_2026',
      areaFilter: 'all',
      referenceTable: 'data.qa_bikelanes_berlin_reference_2026',
      indicators: qaDatasets.bikelanes.defaultIndicators,
      regionId: radinfraRegion.id,
      // Same freeze day as the 2026 eUVM cells (data.euvm_qa_voronoi_2026)
      referenceFrozenAt: new Date('2026-03-02'),
    },
  })
}

export default seedQaConfigs
