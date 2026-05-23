import generatedTopicDocsTranslations from '@/data/generated/topicDocs/inspectorTranslations.gen'
import { translationsParkingLars } from './translationsParkingLars.const'

export const translations: { [key: string]: string } = {
  ...translationsParkingLars,
  ...(generatedTopicDocsTranslations as Record<string, string>),
}
