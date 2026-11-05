import { z } from 'zod'
import type { StudyAreaGeometry } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/area/extractStudyAreaGeometry'
import { MAX_STUDY_AREA_KM2, studyAreaSizeKm2 } from '@/lib/spaceFinderStudyAreaLimit'
import { isDuplicateUserDatasetName, type UserDataset } from '@/lib/spaceFinderUserGeojson'

// Schemas shared by the Flächenfinder forms (client) and the Flächenfinder server functions. No server
// imports here: the client bundles this file.

const MAX_SPACE_FINDER_TITLE_LENGTH = 120

/** Name of a Planungsgebiet or a Variante. */
export const spaceFinderTitleSchema = z
  .string()
  .trim()
  .min(1, 'Bitte einen Namen angeben.')
  .max(
    MAX_SPACE_FINDER_TITLE_LENGTH,
    `Der Name darf höchstens ${MAX_SPACE_FINDER_TITLE_LENGTH} Zeichen haben.`,
  )

export const SpaceFinderUseCaseSchema = z.enum([
  'fahrradbox',
  'fahrradabstellanlage',
  'mobilitaetsstation',
  'sonstiges',
])

export type SpaceFinderUseCase = z.infer<typeof SpaceFinderUseCaseSchema>

/** All names filled in and different from each other. Otherwise the server rejects the list. */
const userDatasetsValid = (datasets: UserDataset[]) =>
  datasets.every(
    (dataset) => dataset.name.trim().length > 0 && !isDuplicateUserDatasetName(datasets, dataset),
  )

/** Values of the create/edit Planungsgebiet form (`AreaWizard`, `AreaEditor`). */
export type SpaceFinderAreaFormValues = {
  title: string
  studyArea: StudyAreaGeometry | null
  userDatasets: UserDataset[]
  useCase: SpaceFinderUseCase
  areaSizeM2: number | null
}

export const SpaceFinderAreaFormSchema = z.object({
  title: spaceFinderTitleSchema,
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
  useCase: SpaceFinderUseCaseSchema,
  areaSizeM2: z.number().min(0).nullable(),
})
