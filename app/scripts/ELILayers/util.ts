import { styleText } from 'node:util'

// biome-ignore lint/suspicious/noExplicitAny: OK
export const log = (title: string | object, object: any = '-') => {
  console.log(styleText(['inverse', 'bold'], ` ${title}${object === '-' ? '' : ':'} `), object)
}

export const warn = (message: string) => {
  console.warn(styleText('yellow', `⚠ ${message}`))
}
