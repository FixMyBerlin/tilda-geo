import { TRegion } from '@/src/server/regions/queries/getRegion'
import Image from 'next/image'

type Props = { regions: TRegion[] | undefined }

export const RegionIntro: React.FC<Props> = ({ regions }) => {
  return (
    <div className="bg-blue-gray-800 relative pt-10 pb-36 md:pt-10">
      <div className="absolute inset-0">
        <Image
          className="h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1562504208-03d85cc8c23e?ixlib=rb-1.2.1?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1920&q=60&&sat=-100"
          alt=""
        />
        <div className="bg-blue-gray-800 absolute inset-0 mix-blend-multiply" aria-hidden="true" />
      </div>

      <div className="relative mx-auto max-w-md px-4 pb-32 sm:max-w-3xl sm:px-6 lg:max-w-7xl lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
          Wähle eine unserer {regions?.length || <em>Loading…</em>} Regionen
        </h1>
        <p className="text-blue-gray-300 mt-6 max-w-3xl text-xl">
          Varius facilisi mauris sed sit. Non sed et duis dui leo, vulputate id malesuada non. Cras
          aliquet purus dui laoreet diam sed lacus, fames. Dui, amet, nec sit pulvinar.
        </p>
      </div>
    </div>
  )
}
