import { styleText } from 'node:util'

const prefix = '[predev]'

export function logOk(label: string) {
  console.log(styleText(['bold', 'green'], `✓ ${prefix} ${label}`))
}

export function logErr(label: string, message: string) {
  console.error(styleText(['bold', 'red'], `✗ ${prefix} ${label}:`), message)
}

export function logSkip(label: string, message: string) {
  console.log(styleText('gray', `○ ${prefix} ${label}: ${message}`))
}

export function logWarn(label: string, message: string) {
  console.log(styleText(['bold', 'yellow'], `⚠ ${prefix} ${label}: ${message}`))
}
