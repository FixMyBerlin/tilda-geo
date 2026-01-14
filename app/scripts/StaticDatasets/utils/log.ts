import chalk from 'chalk'

export const yellow = (s: string, ...rest: any[]) => console.log(chalk.yellow(s), ...rest)
export const green = (s: string, ...rest: any[]) => console.log(chalk.green(s), ...rest)
export const red = (s: string, ...rest: any[]) => console.log(chalk.red(s), ...rest)
export const inverse = (s: string, ...rest: any[]) => console.log(chalk.inverse(s), ...rest)
