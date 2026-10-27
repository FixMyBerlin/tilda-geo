import { z } from 'zod'
import type { StudyAreaGeometry } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/area/extractStudyAreaGeometry'
import { MAX_STUDY_AREA_KM2, studyAreaSizeKm2 } from '@/lib/planningStudyAreaLimit'
import { isDuplicateUserDatasetName, type UserDataset } from '@/lib/planningUserGeojson'

// Schemas shared by the Flächenfinder forms (client) and the planning server functions. No server
// imports here: the client bundles this file.

const MAX_PLANNING_TITLE_LENGTH = 120

/** Name of a Planungsgebiet or a Variante. */
export const planningTitleSchema = z
  .string()
  .trim()
  .min(1, 'Bitte einen Namen angeben.')
  .max(
    MAX_PLANNING_TITLE_LENGTH,
    `Der Name darf höchstens ${MAX_PLANNING_TITLE_LENGTH} Zeichen haben.`,
  )

export const PlanningUseCaseSchema = z.enum([
  'fahrradbox',
  'fahrradabstellanlage',
  'mobilitaetsstation',
  'sonstiges',
])

export type PlanningUseCase = z.infer<typeof PlanningUseCaseSchema>

/** All names filled in and different from each other. Otherwise the server rejects the list. */
const userDatasetsValid = (datasets: UserDataset[]) =>
  datasets.every(
    (dataset) => dataset.name.trim().length > 0 && !isDuplicateUserDatasetName(datasets, dataset),
  )

/** Values of the create/edit Planungsgebiet form (`AreaWizard`, `AreaEditor`). */
export type PlanningAreaFormValues = {
  title: string
  studyArea: StudyAreaGeometry | null
  userDatasets: UserDataset[]
  useCase: PlanningUseCase
  areaSizeM2: number | null
}

export const PlanningAreaFormSchema = z.object({
  title: planningTitleSchema,
  studyArea: z
    .custom<StudyAreaGeometry | null>()
    .refine((geom) => geom != null, 'Bitte ein Gebiet auswählen, zeichnen oder hochladen.')
    .refine(
      (geom) => geom == null || studyAreaSizeKm2(geom) <= MAX_STUDY_AREA_KM2,
      `Das Berechnungsgebiet darf maximal ${MAX_STUDY_AREA_KM2} km² groß sein.`,
    ),
  userDatasets: z
    .custom<UserDataset[]>()
    .refine(userDatasetsValid, 'Jeder Datensatz braucht einen eigenen, nicht leeren Namen.'),
  useCase: PlanningUseCaseSchema,
  areaSizeM2: z.number().min(0).nullable(),
})
