export const TailwindResponsiveHelper = () => {
  return (
    <a
      className="pointer-events-auto flex h-5 flex-row items-center space-x-1 rounded border border-white/70 bg-pink-300 px-1 text-xs shadow-xl hover:underline"
      href="https://tailwindcss.com/docs/responsive-design"
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
  )
}
