import generatedTopicDocsTranslations from '@/data/generated/topicDocs/inspectorTranslations.gen'
import { translationsParkingLars } from './translationsParkingLars.const'
import { translationsSources } from './translationsSources.const'

export const translations: { [key: string]: string } = {
  ...translationsParkingLars,
  ...translationsSources,
  ...(generatedTopicDocsTranslations as Record<string, string>),
}
