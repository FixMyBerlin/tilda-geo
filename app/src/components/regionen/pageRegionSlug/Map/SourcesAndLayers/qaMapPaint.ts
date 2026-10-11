import type { ExpressionSpecification } from 'maplibre-gl'
import {
  systemStatusConfig,
  userStatusConfig,
} from '@/components/regionen/pageRegionSlug/modes/qa/detail/qaConfigs'
import { QA_SYSTEM_STATUS_LETTER, QA_USER_STATUS_LETTER } from '@/shared/qaIndicatorStatus'

/** Hidden by the status filter, or not yet synced. Not the data default (that is `G`). */
export const QA_MAP_UNSTYLED_FILL = 'gray'
export const QA_MAP_UNSTYLED_OUTLINE = '#333333'

/** Light wash. Status stays readable from the outline; the basemap has to show through. */
export const QA_MAP_FILL_OPACITY = 0.35

export const qaMapStatusColorExpression = (unstyledColor: string) =>
  [
    'case',
    ['==', ['feature-state', 'userStatus'], QA_USER_STATUS_LETTER.OK_STRUCTURAL_CHANGE],
    userStatusConfig.OK_STRUCTURAL_CHANGE.hexColor,
    ['==', ['feature-state', 'userStatus'], QA_USER_STATUS_LETTER.OK_REFERENCE_ERROR],
    userStatusConfig.OK_REFERENCE_ERROR.hexColor,
    ['==', ['feature-state', 'userStatus'], QA_USER_STATUS_LETTER.NOT_OK_DATA_ERROR],
    userStatusConfig.NOT_OK_DATA_ERROR.hexColor,
    ['==', ['feature-state', 'userStatus'], QA_USER_STATUS_LETTER.NOT_OK_PROCESSING_ERROR],
    userStatusConfig.NOT_OK_PROCESSING_ERROR.hexColor,
    ['==', ['feature-state', 'userStatus'], QA_USER_STATUS_LETTER.OK_QA_TOOLING_ERROR],
    userStatusConfig.OK_QA_TOOLING_ERROR.hexColor,
    ['==', ['feature-state', 'systemStatus'], QA_SYSTEM_STATUS_LETTER.GOOD],
    systemStatusConfig.GOOD.hexColor,
    ['==', ['feature-state', 'systemStatus'], QA_SYSTEM_STATUS_LETTER.NEEDS_REVIEW],
    systemStatusConfig.NEEDS_REVIEW.hexColor,
    ['==', ['feature-state', 'systemStatus'], QA_SYSTEM_STATUS_LETTER.PROBLEMATIC],
    systemStatusConfig.PROBLEMATIC.hexColor,
    ['==', ['feature-state', 'systemStatus'], QA_SYSTEM_STATUS_LETTER.TRUSTED_EDITOR_CHANGE],
    systemStatusConfig.TRUSTED_EDITOR_CHANGE.hexColor,
    unstyledColor,
  ] satisfies ExpressionSpecification
