import { QaEvaluationStatus, QaEvaluatorType, QaSystemStatus } from '@prisma/client'
import db from '../index'

export default async function seed() {
  // Get the QA config and users for seeding
  const qaConfig = await db.qaConfig.findFirst({
    where: { slug: 'euvm-parkraum-2025' },
  })

  const users = await db.user.findMany({
    take: 2,
  })

  if (!qaConfig || users.length < 2) {
    console.log('⚠️ Skipping QA evaluations seed - missing QA config or users')
    return
  }

  const [user1, user2] = users
  if (!user1 || !user2) {
    console.log('⚠️ Skipping QA evaluations seed - missing users')
    return
  }

  // Test data for area 3511: system review > user good > system bad (reset) > user review
  const evaluations3511 = [
    {
      areaId: '3511',
      configId: qaConfig.id,
      systemStatus: QaSystemStatus.NEEDS_REVIEW,
      userStatus: null,
      body: null,
      evaluatorType: QaEvaluatorType.SYSTEM,
      userId: null,
      createdAt: new Date('2024-01-15T10:00:00Z'),
    },
    {
      areaId: '3511',
      configId: qaConfig.id,
      systemStatus: QaSystemStatus.NEEDS_REVIEW,
      userStatus: QaEvaluationStatus.OK_STRUCTURAL_CHANGE,
      body: 'Bauarbeiten im Gange, temporäre Änderungen erwartet',
      evaluatorType: QaEvaluatorType.USER,
      userId: user1.id,
      createdAt: new Date('2024-01-15T14:30:00Z'),
    },
    {
      areaId: '3511',
      configId: qaConfig.id,
      systemStatus: QaSystemStatus.PROBLEMATIC,
      userStatus: null,
      body: null,
      evaluatorType: QaEvaluatorType.SYSTEM,
      userId: null,
      createdAt: new Date('2024-01-16T09:15:00Z'),
    },
    {
      areaId: '3511',
      configId: qaConfig.id,
      systemStatus: QaSystemStatus.PROBLEMATIC,
      userStatus: QaEvaluationStatus.NOT_OK_DATA_ERROR,
      body: 'Datenqualitätsprobleme erkannt, manuelle Überprüfung erforderlich',
      evaluatorType: QaEvaluatorType.USER,
      userId: user2.id,
      createdAt: new Date('2024-01-16T16:45:00Z'),
    },
  ]

  // Test data for area 3510: system bad > user good (construction) > other user review > same user "good data fixed"
  const evaluations3510 = [
    {
      areaId: '3510',
      configId: qaConfig.id,
      systemStatus: QaSystemStatus.PROBLEMATIC,
      userStatus: null,
      body: null,
      evaluatorType: QaEvaluatorType.SYSTEM,
      userId: null,
      createdAt: new Date('2024-01-14T08:00:00Z'),
    },
    {
      areaId: '3510',
      configId: qaConfig.id,
      systemStatus: QaSystemStatus.PROBLEMATIC,
      userStatus: QaEvaluationStatus.OK_STRUCTURAL_CHANGE,
      body: 'OK Bauarbeiten. Umfangreiche Straßenarbeiten beeinflussen die Parkkapazität in diesem Bereich.',
      evaluatorType: QaEvaluatorType.USER,
      userId: user1.id,
      createdAt: new Date('2024-01-14T11:20:00Z'),
    },
    {
      areaId: '3510',
      configId: qaConfig.id,
      systemStatus: QaSystemStatus.PROBLEMATIC,
      userStatus: QaEvaluationStatus.NOT_OK_DATA_ERROR,
      body: 'Aber was ist mit dem Norden? Der nördliche Abschnitt zeigt Inkonsistenzen, die untersucht werden müssen.',
      evaluatorType: QaEvaluatorType.USER,
      userId: user2.id,
      createdAt: new Date('2024-01-14T15:45:00Z'),
    },
    {
      areaId: '3510',
      configId: qaConfig.id,
      systemStatus: QaSystemStatus.PROBLEMATIC,
      userStatus: QaEvaluationStatus.OK_STRUCTURAL_CHANGE,
      body: 'Gute Daten korrigiert. Danke, Daten aktualisiert; jetzt gut.',
      evaluatorType: QaEvaluatorType.USER,
      userId: user1.id,
      createdAt: new Date('2024-01-15T13:30:00Z'),
    },
  ]

  // Create all evaluations
  const allEvaluations = [...evaluations3511, ...evaluations3510]

  for (const evaluation of allEvaluations) {
    await db.qaEvaluation.upsert({
      where: {
        id: -1, // This will never match, so it will always create
      },
      update: {},
      create: evaluation,
    })
  }
}
