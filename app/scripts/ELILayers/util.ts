import { styleText } from 'node:util'

export const log = (title: string | Object, object: any = '-') => {
  console.log(styleText(['inverse', 'bold'], ` ${title}${object === '-' ? '' : ':'} `), object)
}

export const warn = (message: string) => {
  console.warn(styleText('yellow', `⚠ ${message}`))
}
