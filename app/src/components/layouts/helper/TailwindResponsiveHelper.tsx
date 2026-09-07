import { isDev } from '@/components/shared/utils/isEnv'

function ignoreParentTriggerClick(event: React.MouseEvent<HTMLAnchorElement>) {
  event.stopPropagation()
}

export const TailwindResponsiveHelper = () => {
  if (!isDev) return null

  return (
    <span className="flex h-5 flex-row items-center rounded border border-white/70 bg-pink-300 text-xs shadow-xl print:hidden">
      <span className="px-1 hover:underline">TanStack</span>
      <span className="w-px self-stretch bg-white/70" aria-hidden />
      <a
        className="flex h-full flex-row items-center space-x-1 px-1 hover:underline"
        href="https://tailwindcss.com/docs/responsive-design"
        onClick={ignoreParentTriggerClick}
      >
        <span className="font-bold underline" title="<640px Mobile">
          📱
        </span>
        <span className="sm:font-bold sm:underline" title="640px">
          sm
        </span>
        <span className="md:font-bold md:underline" title="768px">
          md
        </span>
        <span className="lg:font-bold lg:underline" title="1024px">
          lg
        </span>
        <span className="xl:font-bold xl:underline" title="1280px">
          xl
        </span>
        <span className="2xl:font-bold 2xl:underline" title="1536px">
          2xl
        </span>
      </a>
    </span>
  )
}
