import { styleText } from 'node:util'

const prefix = '[predev]'

/** Where to read how a worktree gets its db and ports; predev errors point here. */
export const devStackSkillHint =
  'How to: .agents/skills/tilda-geo-agent-workflow/SKILL.md, section "2. Docker and predev" (table "Which db stack?", "Worktree attaching to develop").'

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
