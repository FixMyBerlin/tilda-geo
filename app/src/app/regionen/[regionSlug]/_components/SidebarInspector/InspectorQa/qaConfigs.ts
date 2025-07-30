import {
  CheckCircleIcon,
  CogIcon,
  ExclamationTriangleIcon,
  UserIcon,
  XCircleIcon,
} from '@heroicons/react/20/solid'

// QA System Status Colors (from specification)
export const QA_SYSTEM_STATUS_COLORS = {
  GOOD: '#009E73', // Green - no review needed
  NEEDS_REVIEW: '#E69F00', // Yellow - requires human evaluation
  PROBLEMATIC: '#D55E00', // Red - action needed
} as const

// QA User Status Colors (from specification)
export const QA_USER_STATUS_COLORS = {
  OK_STRUCTURAL_CHANGE: '#0066CC', // Blue - user confirmed OK
  OK_REFERENCE_ERROR: '#0066CC', // Blue - user confirmed OK
  NOT_OK_DATA_ERROR: '#D55E00', // Red - user confirmed problem
  NOT_OK_PROCESSING_ERROR: '#D55E00', // Red - user confirmed problem
} as const

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
    icon: XCircleIcon,
    description: 'Große Abweichung - dringende Überprüfung erforderlich',
  },
} as const

// User Status Configuration
export const userStatusConfig = {
  OK_STRUCTURAL_CHANGE: {
    label: 'OK - Strukturelle Änderung',
    color: 'text-green-600',
    hexColor: QA_USER_STATUS_COLORS.OK_STRUCTURAL_CHANGE,
  },
  OK_REFERENCE_ERROR: {
    label: 'OK - Referenzfehler',
    color: 'text-green-600',
    hexColor: QA_USER_STATUS_COLORS.OK_REFERENCE_ERROR,
  },
  NOT_OK_DATA_ERROR: {
    label: 'Nicht OK - Datenfehler',
    color: 'text-red-600',
    hexColor: QA_USER_STATUS_COLORS.NOT_OK_DATA_ERROR,
  },
  NOT_OK_PROCESSING_ERROR: {
    label: 'Nicht OK - Verarbeitungsfehler',
    color: 'text-red-600',
    hexColor: QA_USER_STATUS_COLORS.NOT_OK_PROCESSING_ERROR,
  },
} as const

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
    color: 'text-blue-500',
  },
} as const

// User Status Options for Form
export const userStatusOptions = [
  {
    value: 'OK_STRUCTURAL_CHANGE' as const,
    label: 'OK - Strukturelle Änderung',
    description: 'Differenz OK, verursacht durch strukturelle Änderung im Gebiet wie Bauarbeiten',
    hexColor: QA_USER_STATUS_COLORS.OK_STRUCTURAL_CHANGE,
  },
  {
    value: 'OK_REFERENCE_ERROR' as const,
    label: 'OK - Referenzfehler',
    description: 'Differenz OK, verursacht durch falsche Vergangenheits-/Referenzdaten',
    hexColor: QA_USER_STATUS_COLORS.OK_REFERENCE_ERROR,
  },
  {
    value: 'NOT_OK_DATA_ERROR' as const,
    label: 'Nicht OK - Datenfehler',
    description: 'Differenz nicht OK, aktuelle Daten müssen korrigiert werden',
    hexColor: QA_USER_STATUS_COLORS.NOT_OK_DATA_ERROR,
  },
  {
    value: 'NOT_OK_PROCESSING_ERROR' as const,
    label: 'Nicht OK - Verarbeitungsfehler',
    description: 'Differenz nicht OK, Verarbeitung muss korrigiert werden',
    hexColor: QA_USER_STATUS_COLORS.NOT_OK_PROCESSING_ERROR,
  },
] as const

// Type helpers
export type SystemStatusConfig = typeof systemStatusConfig
export type UserStatusConfig = typeof userStatusConfig
export type EvaluatorTypeConfig = typeof evaluatorTypeConfig
export type UserStatusOption = (typeof userStatusOptions)[number]
