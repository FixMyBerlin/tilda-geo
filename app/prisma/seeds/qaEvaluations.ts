import { QaEvaluationStatus, QaEvaluatorType, QaSystemStatus } from '@/prisma/generated/client'
import type { QaDecisionData } from '@/server/qa-configs/schemas/qaDecisionDataSchema'
import db from '../../src/server/db.server'

const thresholds = { goodThreshold: 0.1, needsReviewThreshold: 0.2, absoluteDifferenceThreshold: 4 }

type Breakdown = Record<string, { reference: number; current: number }>

/** A snapshot as the nightly writes it, values worked out by hand (docs/QA-Documentation.md). */
const snapshot = (
  values: { reference: number; current: number; difference: number; deviation: number },
  breakdown?: Breakdown,
) => ({ ...values, ...(breakdown ? { breakdown } : {}), thresholds }) satisfies QaDecisionData

const conditionCategoryBreakdown = {
  free: { reference: 70, current: 40 },
  paid: { reference: 30, current: 15 },
  residents: { reference: 0, current: 10 },
}
// 45 spaces lost (free, paid), 10 gained (residents): 45 of 100
const conditionCategoryDecisionData = snapshot(
  { reference: 100, current: 65, difference: 45, deviation: 0.45 },
  conditionCategoryBreakdown,
)

export default async function seed() {
  const qaConfig = await db.qaConfig.findFirst({
    where: { slug: 'dev-parkraum-qa-2025' },
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

  // Area 3511, indicator "total": system review > user good (structural change) > system bad
  // (reset) > user review (data error)
  const evaluations3511 = [
    {
      areaId: '3511',
      configId: qaConfig.id,
      indicatorKey: 'total',
      systemStatus: QaSystemStatus.NEEDS_REVIEW,
      userStatus: null,
      body: null,
      evaluatorType: QaEvaluatorType.SYSTEM,
      userId: null,
      decisionData: snapshot({ reference: 100, current: 85, difference: 15, deviation: 0.15 }), // NEEDS_REVIEW
      createdAt: new Date('2024-01-15T10:00:00Z'),
    },
    {
      areaId: '3511',
      configId: qaConfig.id,
      indicatorKey: 'total',
      systemStatus: QaSystemStatus.NEEDS_REVIEW,
      userStatus: QaEvaluationStatus.OK_STRUCTURAL_CHANGE,
      body: 'Bauarbeiten im Gange, temporäre Änderungen erwartet',
      evaluatorType: QaEvaluatorType.USER,
      userId: user1.id,
      decisionData: snapshot({ reference: 100, current: 85, difference: 15, deviation: 0.15 }),
      createdAt: new Date('2024-01-15T14:30:00Z'),
    },
    {
      areaId: '3511',
      configId: qaConfig.id,
      indicatorKey: 'total',
      systemStatus: QaSystemStatus.PROBLEMATIC,
      userStatus: null,
      body: null,
      evaluatorType: QaEvaluatorType.SYSTEM,
      userId: null,
      decisionData: snapshot({ reference: 100, current: 70, difference: 30, deviation: 0.3 }), // PROBLEMATIC
      createdAt: new Date('2024-01-16T09:15:00Z'),
    },
    {
      areaId: '3511',
      configId: qaConfig.id,
      indicatorKey: 'total',
      systemStatus: QaSystemStatus.PROBLEMATIC,
      userStatus: QaEvaluationStatus.NOT_OK_DATA_ERROR,
      body: 'Datenqualitätsprobleme erkannt, manuelle Überprüfung erforderlich',
      evaluatorType: QaEvaluatorType.USER,
      userId: user2.id,
      decisionData: snapshot({ reference: 100, current: 70, difference: 30, deviation: 0.3 }),
      createdAt: new Date('2024-01-16T16:45:00Z'),
    },
  ]

  // Area 3510, indicator "condition_category_primary": system bad > user good (construction) > other user review
  // (data error) > same user "good data fixed" (structural change)
  const evaluations3510 = [
    {
      areaId: '3510',
      configId: qaConfig.id,
      indicatorKey: 'condition_category_primary',
      systemStatus: QaSystemStatus.PROBLEMATIC,
      userStatus: null,
      body: null,
      evaluatorType: QaEvaluatorType.SYSTEM,
      userId: null,
      decisionData: conditionCategoryDecisionData,
      createdAt: new Date('2024-01-14T08:00:00Z'),
    },
    {
      areaId: '3510',
      configId: qaConfig.id,
      indicatorKey: 'condition_category_primary',
      systemStatus: QaSystemStatus.PROBLEMATIC,
      userStatus: QaEvaluationStatus.OK_STRUCTURAL_CHANGE,
      body: 'OK Bauarbeiten. Während der Straßenarbeiten gelten in diesem Bereich andere Parkregeln.',
      evaluatorType: QaEvaluatorType.USER,
      userId: user1.id,
      decisionData: conditionCategoryDecisionData,
      createdAt: new Date('2024-01-14T11:20:00Z'),
    },
    {
      areaId: '3510',
      configId: qaConfig.id,
      indicatorKey: 'condition_category_primary',
      systemStatus: QaSystemStatus.PROBLEMATIC,
      userStatus: QaEvaluationStatus.NOT_OK_DATA_ERROR,
      body: 'Aber was ist mit dem Norden? Der nördliche Abschnitt zeigt Inkonsistenzen, die untersucht werden müssen.',
      evaluatorType: QaEvaluatorType.USER,
      userId: user2.id,
      decisionData: conditionCategoryDecisionData,
      createdAt: new Date('2024-01-14T15:45:00Z'),
    },
    {
      areaId: '3510',
      configId: qaConfig.id,
      indicatorKey: 'condition_category_primary',
      systemStatus: QaSystemStatus.PROBLEMATIC,
      userStatus: QaEvaluationStatus.OK_STRUCTURAL_CHANGE,
      body: 'Gute Daten korrigiert. Danke, Daten aktualisiert; jetzt gut.',
      evaluatorType: QaEvaluatorType.USER,
      userId: user1.id,
      decisionData: conditionCategoryDecisionData,
      createdAt: new Date('2024-01-15T13:30:00Z'),
    },
  ]

  // Area 3512, indicator "total": processing error test (increase instead of decrease)
  const evaluations3512 = [
    {
      areaId: '3512',
      configId: qaConfig.id,
      indicatorKey: 'total',
      systemStatus: QaSystemStatus.PROBLEMATIC,
      userStatus: QaEvaluationStatus.NOT_OK_PROCESSING_ERROR,
      body: 'Verarbeitungsfehler erkannt - Algorithmus muss korrigiert werden',
      evaluatorType: QaEvaluatorType.USER,
      userId: user1.id,
      decisionData: snapshot({ reference: 100, current: 150, difference: 50, deviation: 0.3333 }), // PROBLEMATIC
      createdAt: new Date('2024-01-17T10:00:00Z'),
    },
  ]

  const allEvaluations = [...evaluations3511, ...evaluations3510, ...evaluations3512]

  await db.qaEvaluation.createMany({
    data: allEvaluations,
  })
}
