import { BBOX_PRESETS } from '../processing-generate-command/bboxPresets'

const GEO_BOOTSTRAP_PRESET = 'seed-herrfurthplatz' satisfies keyof typeof BBOX_PRESETS

/** Non-interactive flags for a minimal local geo setup (~30s with cached PBF). */
export const GEO_BOOTSTRAP_FLAGS = [
  '--preset',
  GEO_BOOTSTRAP_PRESET,
  '--diff-mode',
  'off',
  '--all-topics',
  '--skip-download',
  '1',
  '--skip-unchanged',
  '0',
  '--skip-warm-cache',
  '1',
  '--wait-fresh-data',
  '0',
  '--foreground',
] as const
