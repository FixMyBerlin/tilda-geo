import db from '../index'

const seedQaConfigs = async () => {
  const parkraumRegion = await db.region.findFirstOrThrow({
    where: { slug: 'parkraum-berlin-euvm' },
  })

  await db.qaConfig.create({
    data: {
      slug: 'euvm-parkraum-2025',
      label: 'eUVM Parkraum 2025',
      isActive: true,
      mapTable: 'public.qa_parkings_euvm',
      goodThreshold: 0.2,
      needsReviewThreshold: 0.5,
      problematicThreshold: 1.0,
      regionId: parkraumRegion.id,
    },
  })
}

export default seedQaConfigs
