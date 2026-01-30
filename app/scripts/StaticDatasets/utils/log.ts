import { styleText } from 'node:util'

export const yellow = (s: string, ...rest: any[]) => console.log(styleText('yellow', s), ...rest)
export const green = (s: string, ...rest: any[]) => console.log(styleText('green', s), ...rest)
export const red = (s: string, ...rest: any[]) => console.log(styleText('red', s), ...rest)
export const inverse = (s: string, ...rest: any[]) => console.log(styleText('inverse', s), ...rest)
