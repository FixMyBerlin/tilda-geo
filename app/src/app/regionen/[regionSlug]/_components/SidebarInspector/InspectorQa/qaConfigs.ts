import {
  CheckCircleIcon,
  CogIcon,
  ExclamationTriangleIcon,
  UserIcon,
} from '@heroicons/react/20/solid'
import { QaEvaluationStatus, QaEvaluatorType, QaSystemStatus } from '@prisma/client'

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
} as const satisfies Record<QaEvaluationStatus, `#${string}`>

// System status to letter mapping for optimization
export const SYSTEM_STATUS_TO_LETTER = {
  GOOD: 'G', // Good
  NEEDS_REVIEW: 'N', // Needs Review
  PROBLEMATIC: 'P', // Problematic
} as const satisfies Record<QaSystemStatus, string>

// Letter to system status mapping for translation back
export const LETTER_TO_SYSTEM_STATUS: Record<string, QaSystemStatus> = {
  G: 'GOOD',
  N: 'NEEDS_REVIEW',
  P: 'PROBLEMATIC',
} as const satisfies Record<string, QaSystemStatus>

// User status to letter mapping for optimization (only user status needed for filtering)
export const USER_STATUS_TO_LETTER = {
  OK_STRUCTURAL_CHANGE: 'S', // Structural
  OK_REFERENCE_ERROR: 'R', // Reference
  NOT_OK_DATA_ERROR: 'D', // Data
  NOT_OK_PROCESSING_ERROR: 'P', // Processing
} as const satisfies Record<QaEvaluationStatus, string>

// Letter to user status mapping for translation back
export const LETTER_TO_USER_STATUS: Record<string, QaEvaluationStatus> = {
  S: 'OK_STRUCTURAL_CHANGE',
  R: 'OK_REFERENCE_ERROR',
  D: 'NOT_OK_DATA_ERROR',
  P: 'NOT_OK_PROCESSING_ERROR',
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
} as const satisfies Record<QaSystemStatus, Object>

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
} as const satisfies Record<QaEvaluationStatus, Object>

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
} as const satisfies Record<QaEvaluatorType, Object>

// User Status Options for Form
export const userStatusOptions = [
  {
    value: 'OK_STRUCTURAL_CHANGE' as const,
    label: 'OK (Strukturelle Änderung)',
    description: 'Differenz OK, verursacht durch bspw. Bauarbeiten im Gebiet',
    hexColor: QA_USER_STATUS_COLORS.OK_STRUCTURAL_CHANGE,
  },
  {
    value: 'OK_REFERENCE_ERROR' as const,
    label: 'OK (Fehler Referenzdaten)',
    description: 'Differenz OK, verursacht durch falsche Vergangenheits-/Referenzdaten',
    hexColor: QA_USER_STATUS_COLORS.OK_REFERENCE_ERROR,
  },
  {
    value: 'NOT_OK_DATA_ERROR' as const,
    label: 'Nicht OK (OSM)',
    description: 'Differenz nicht OK, aktuelle Daten müssen korrigiert werden',
    hexColor: QA_USER_STATUS_COLORS.NOT_OK_DATA_ERROR,
  },
  {
    value: 'NOT_OK_PROCESSING_ERROR' as const,
    label: 'Nicht OK (Verarbeitungsfehler)',
    description: 'Differenz nicht OK, Verarbeitung muss korrigiert werden',
    hexColor: QA_USER_STATUS_COLORS.NOT_OK_PROCESSING_ERROR,
  },
] as const satisfies Array<{
  value: QaEvaluationStatus
  label: string
  description: string
  hexColor: (typeof QA_USER_STATUS_COLORS)[keyof typeof QA_USER_STATUS_COLORS]
}>
