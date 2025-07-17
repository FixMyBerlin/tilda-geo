// @ts-check
/** @type {import("prettier").Config} */
const prettierConfig = {
  semi: false,
  singleQuote: true,
  arrowParens: 'always',
  printWidth: 100,
  plugins: ['prettier-plugin-organize-imports', 'prettier-plugin-tailwindcss'],
  tailwindAttributes: ['positionClasses', 'classNameOverwrite'],
  tailwindFunctions: ['twMerge', 'clsx', 'twJoin'],
  overrides: [
    {
      files:
        // ./src/app/regionen/[regionSlug]/_components/SidebarInspector/TagsTable/*
        // See https://github.com/prettier/prettier-cli/issues/70
        '**/translations/*.const.ts',
      options: {
        printWidth: 1000,
      },
    },
  ],
}

export default prettierConfig
