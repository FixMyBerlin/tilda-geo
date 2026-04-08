import generatedTopicDocsTranslations from '@/data/generated/topicDocs/inspector/translations.gen.json'
// Prettier: Overwrite via app/.prettierrc.mjs
import { translationsAtlasAndAll } from './translationsAtlasAndAll.const'
import { translationsOneway } from './translationsOneway.const'
import { translationsParkingLars } from './translationsParkingLars.const'
import { translationsSeparationTrafficModeMarking } from './translationsSeparationTrafficModeMarking.const'
import { translationsTagsTableRowCompositConditionCategory } from './translationsTagsTableRowCompositConditionCategory.const'
import { translationsTildaParkingsInspector } from './translationsTildaParkingsInspector.const'
import { translationsWdith } from './translationsWdith.const'

/* prettier-ignore */
export const translations: { [key: string]: string } = {
  ...translationsParkingLars,
  ...translationsOneway,
  ...translationsSeparationTrafficModeMarking,
  ...translationsWdith,
  ...(generatedTopicDocsTranslations as Record<string, string>),
  ...translationsTagsTableRowCompositConditionCategory,
  ...translationsTildaParkingsInspector,
  ...translationsAtlasAndAll,
}
