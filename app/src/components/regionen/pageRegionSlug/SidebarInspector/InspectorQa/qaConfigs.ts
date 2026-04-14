import {
  CheckCircleIcon,
  CogIcon,
  ExclamationTriangleIcon,
  UserIcon,
} from '@heroicons/react/20/solid'
import type { QaEvaluatorType } from '@/prisma/generated/browser'
import { QaEvaluationStatus, QaSystemStatus } from '@/prisma/generated/browser'

// QA System Status Colors (from specification)
export const QA_SYSTEM_STATUS_COLORS = {
  GOOD: '#009E73', // Green - no review needed
  NEEDS_REVIEW: '#E69F00', // Yellow - requires human evaluation
  PROBLEMATIC: '#D55E00', // Red - action needed
} as const satisfies Record<QaSystemStatus, `#${string}`>

// QA User Status Colors (from specification)
export const QA_USER_STATUS_COLORS = {
  OK_STRUCTURAL_CHANGE: '#009E73', // Green - user confirmed OK
  OK_REFERENCE_ERROR: '#009E73', // Green - user confirmed OK
  NOT_OK_DATA_ERROR: '#D55E00', // Red - user confirmed problem
  NOT_OK_PROCESSING_ERROR: '#D55E00', // Red - user confirmed problem
  OK_QA_TOOLING_ERROR: '#0d9488', // Tailwind teal-600 — OK, distinct from other OK greens
} as const satisfies Record<QaEvaluationStatus, `#${string}`>

// System status to letter mapping for optimization
export const SYSTEM_STATUS_TO_LETTER = {
  GOOD: 'G', // Good
  NEEDS_REVIEW: 'N', // Needs Review
  PROBLEMATIC: 'P', // Problematic
} as const satisfies Record<QaSystemStatus, string>

// Letter to system status mapping for translation back
export const LETTER_TO_SYSTEM_STATUS: Record<string, QaSystemStatus> = {
  G: QaSystemStatus.GOOD,
  N: QaSystemStatus.NEEDS_REVIEW,
  P: QaSystemStatus.PROBLEMATIC,
} as const satisfies Record<string, QaSystemStatus>

// User status to letter mapping for optimization (only user status needed for filtering)
export const USER_STATUS_TO_LETTER = {
  OK_STRUCTURAL_CHANGE: 'S', // Structural
  OK_REFERENCE_ERROR: 'R', // Reference
  NOT_OK_DATA_ERROR: 'D', // Data
  NOT_OK_PROCESSING_ERROR: 'P', // Processing
  OK_QA_TOOLING_ERROR: 'QA', // QA Tooling Error
} as const satisfies Record<QaEvaluationStatus, string>

// Letter to user status mapping for translation back
export const LETTER_TO_USER_STATUS: Record<string, QaEvaluationStatus> = {
  S: QaEvaluationStatus.OK_STRUCTURAL_CHANGE,
  R: QaEvaluationStatus.OK_REFERENCE_ERROR,
  D: QaEvaluationStatus.NOT_OK_DATA_ERROR,
  P: QaEvaluationStatus.NOT_OK_PROCESSING_ERROR,
  QA: QaEvaluationStatus.OK_QA_TOOLING_ERROR,
} as const satisfies Record<string, QaEvaluationStatus>

// System Status Configuration
export const systemStatusConfig = {
  GOOD: {
    label: 'Gut',
    color: 'bg-green-500',
    textColor: 'text-green-500',
    hexColor: QA_SYSTEM_STATUS_COLORS.GOOD,
    icon: CheckCircleIcon,
    description: 'Keine Überprüfung erforderlich',
  },
  NEEDS_REVIEW: {
    label: 'Überprüfung erforderlich',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-500',
    hexColor: QA_SYSTEM_STATUS_COLORS.NEEDS_REVIEW,
    icon: ExclamationTriangleIcon,
    description: 'Mittlere Abweichung - manuelle Überprüfung empfohlen',
  },
  PROBLEMATIC: {
    label: 'Problematisch',
    color: 'bg-red-500',
    textColor: 'text-red-500',
    hexColor: QA_SYSTEM_STATUS_COLORS.PROBLEMATIC,
    icon: ExclamationTriangleIcon,
    description: 'Große Abweichung - dringende Überprüfung erforderlich',
  },
} as const satisfies Record<QaSystemStatus, object>

// User Status Configuration
export const userStatusConfig = {
  OK_STRUCTURAL_CHANGE: {
    label: 'OK (Strukturelle Änderung)',
    color: 'text-green-600',
    hexColor: QA_USER_STATUS_COLORS.OK_STRUCTURAL_CHANGE,
  },
  OK_REFERENCE_ERROR: {
    label: 'OK (Fehler Referenzdaten)',
    color: 'text-green-600',
    hexColor: QA_USER_STATUS_COLORS.OK_REFERENCE_ERROR,
  },
  NOT_OK_DATA_ERROR: {
    label: 'Nicht OK (OSM)',
    color: 'text-red-600',
    hexColor: QA_USER_STATUS_COLORS.NOT_OK_DATA_ERROR,
  },
  NOT_OK_PROCESSING_ERROR: {
    label: 'Nicht OK (Prozessierung)',
    color: 'text-red-600',
    hexColor: QA_USER_STATUS_COLORS.NOT_OK_PROCESSING_ERROR,
  },
  OK_QA_TOOLING_ERROR: {
    label: 'OK (QA-Tooling-Fehler)',
    color: 'text-teal-600',
    hexColor: QA_USER_STATUS_COLORS.OK_QA_TOOLING_ERROR,
  },
} as const satisfies Record<QaEvaluationStatus, object>

// Evaluator Type Configuration
export const evaluatorTypeConfig = {
  SYSTEM: {
    label: 'System',
    icon: CogIcon,
    color: 'text-gray-500',
  },
  USER: {
    label: 'Benutzer',
    icon: UserIcon,
    color: 'text-gray-500',
  },
} as const satisfies Record<QaEvaluatorType, object>

// User Status Options for Form
export const userStatusOptions = [
  {
    value: QaEvaluationStatus.OK_STRUCTURAL_CHANGE,
    label: 'OK (Strukturelle Änderung)',
    description: 'Differenz OK, verursacht durch bspw. Bauarbeiten im Gebiet',
    hexColor: QA_USER_STATUS_COLORS.OK_STRUCTURAL_CHANGE,
  },
  {
    value: QaEvaluationStatus.OK_REFERENCE_ERROR,
    label: 'OK (Fehler Referenzdaten)',
    description: 'Differenz OK, verursacht durch falsche Vergangenheits-/Referenzdaten',
    hexColor: QA_USER_STATUS_COLORS.OK_REFERENCE_ERROR,
  },
  {
    value: QaEvaluationStatus.NOT_OK_DATA_ERROR,
    label: 'Nicht OK (OSM)',
    description: 'Differenz nicht OK, aktuelle Daten müssen korrigiert werden',
    hexColor: QA_USER_STATUS_COLORS.NOT_OK_DATA_ERROR,
  },
  {
    value: QaEvaluationStatus.NOT_OK_PROCESSING_ERROR,
    label: 'Nicht OK (Verarbeitungsfehler)',
    description: 'Differenz nicht OK, Verarbeitung muss korrigiert werden',
    hexColor: QA_USER_STATUS_COLORS.NOT_OK_PROCESSING_ERROR,
  },
  {
    value: QaEvaluationStatus.OK_QA_TOOLING_ERROR,
    label: 'OK (QA-Tooling-Fehler)',
    description:
      'Differenz OK, verursacht durch methodischen Fehler im QA-Tooling (z.B. Geometrien oder Definitionen)',
    hexColor: QA_USER_STATUS_COLORS.OK_QA_TOOLING_ERROR,
  },
] as const satisfies Array<{
  value: QaEvaluationStatus
  label: string
  description: string
  hexColor: (typeof QA_USER_STATUS_COLORS)[keyof typeof QA_USER_STATUS_COLORS]
}>
