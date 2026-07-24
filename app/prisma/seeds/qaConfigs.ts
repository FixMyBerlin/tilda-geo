import db from '../../src/server/db.server'

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
      goodThreshold: 0.1,
      needsReviewThreshold: 0.2,
      absoluteDifferenceThreshold: 4,
      regionId: parkraumRegion.id,
    },
  })
}

export default seedQaConfigs
