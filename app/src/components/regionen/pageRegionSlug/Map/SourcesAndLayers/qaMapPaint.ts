import type { ExpressionSpecification } from 'maplibre-gl'
import {
  SYSTEM_STATUS_TO_LETTER,
  USER_STATUS_TO_LETTER,
  systemStatusConfig,
  userStatusConfig,
} from '@/components/regionen/pageRegionSlug/modes/qa/detail/qaConfigs'

/** Hidden by the status filter, or not yet synced. Not the data default (that is `G`). */
export const QA_MAP_UNSTYLED_FILL = 'gray'
export const QA_MAP_UNSTYLED_OUTLINE = '#333333'

export const qaMapStatusColorExpression = (unstyledColor: string) =>
  [
    'case',
    ['==', ['feature-state', 'userStatus'], USER_STATUS_TO_LETTER.OK_STRUCTURAL_CHANGE],
    userStatusConfig.OK_STRUCTURAL_CHANGE.hexColor,
    ['==', ['feature-state', 'userStatus'], USER_STATUS_TO_LETTER.OK_REFERENCE_ERROR],
    userStatusConfig.OK_REFERENCE_ERROR.hexColor,
    ['==', ['feature-state', 'userStatus'], USER_STATUS_TO_LETTER.NOT_OK_DATA_ERROR],
    userStatusConfig.NOT_OK_DATA_ERROR.hexColor,
    ['==', ['feature-state', 'userStatus'], USER_STATUS_TO_LETTER.NOT_OK_PROCESSING_ERROR],
    userStatusConfig.NOT_OK_PROCESSING_ERROR.hexColor,
    ['==', ['feature-state', 'userStatus'], USER_STATUS_TO_LETTER.OK_QA_TOOLING_ERROR],
    userStatusConfig.OK_QA_TOOLING_ERROR.hexColor,
    ['==', ['feature-state', 'systemStatus'], SYSTEM_STATUS_TO_LETTER.GOOD],
    systemStatusConfig.GOOD.hexColor,
    ['==', ['feature-state', 'systemStatus'], SYSTEM_STATUS_TO_LETTER.NEEDS_REVIEW],
    systemStatusConfig.NEEDS_REVIEW.hexColor,
    ['==', ['feature-state', 'systemStatus'], SYSTEM_STATUS_TO_LETTER.PROBLEMATIC],
    systemStatusConfig.PROBLEMATIC.hexColor,
    unstyledColor,
  ] as ExpressionSpecification
