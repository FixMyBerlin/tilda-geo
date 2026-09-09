export const BBOX_PRESETS = {
  bussonderstreifen: '13.38486,52.43778,13.38956,52.43959',
  'berlin-full': '13.0883,52.3382,13.7611,52.6755',
  'obstacle-parking-yes':
    '13.405287099192833,52.50837530588882,13.410218310776344,52.51078864624628',
  'circle-kreisverkehr':
    '13.304848152351326,52.44115376821972,13.317513299482641,52.446557694962536',
  'xhain-kreuzberg': '13.380,52.488,13.418,52.503',
  'neukoelln-nord': '13.41904861,52.467335,13.4616607,52.487559',
  // `bun run seed` geo-bootstrap (`app/scripts/geo-bootstrap/flags.ts`)
  'seed-herrfurthplatz': '13.4209256,52.4763157,13.4272212,52.4779464',
} as const satisfies Record<string, string>
