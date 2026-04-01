// Raw ANSI so colors show in Vite/Nitro output (stdout may not be a TTY; FORCE_COLOR helps styleText but raw codes are reliable)
const greenBold = (s: string) => `\x1b[1m\x1b[32m${s}\x1b[0m`

export const pluginOk = (prefix: string, message: string) =>
  console.log(greenBold(`✓ ${prefix} ${message}`))
