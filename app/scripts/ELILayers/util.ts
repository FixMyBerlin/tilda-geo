import { styleText } from 'node:util'

// oxlint-disable-next-line typescript/no-explicit-any -- OK
export const log = (title: string | object, object: any = '-') => {
  console.log(styleText(['inverse', 'bold'], ` ${title}${object === '-' ? '' : ':'} `), object)
}

export const warn = (message: string) => {
  console.warn(styleText('yellow', `⚠ ${message}`))
}
