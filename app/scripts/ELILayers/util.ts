import chalk from 'chalk'

export const log = (title: string | Object, object: any = '-') => {
  console.log(chalk.inverse.bold(` ${title}${object === '-' ? '' : ':'} `), object)
}

export const warn = (message: string) => {
  console.warn(chalk.yellow(`⚠ ${message}`))
}
