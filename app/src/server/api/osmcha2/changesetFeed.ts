// Converts a changeset RSS feed into one whose entries link to OSMCha2 (https://github.com/tordans/osmcha2).
//
// Contract: a working RSS 2.0 feed from one of `feedSources`. Every `<item>` has
// - the changeset id in `<guid>` or `<link>` as `…/changeset/<id>` or `…/changesets/<id>`
// - OSMCha: `<title>Changeset <id> by <user>`, `<description>comment<br>Create: 0, Modify: 2, Delete: 0`
//   and a `<georss:polygon>` of `lat lon` pairs
// - WhoDidIt: `<title>` comment, `<author>` user and a description like
//   `… using <editor>, titled "…" … <li>Nodes: 1 created, 0 modified, 0 deleted</li>`
// What does not match is left out. Items without a changeset id are passed through unchanged.

const OSMCHA2_URL = 'https://tordans.github.io/osmcha2'

type Link = [label: string, href: string]
type Details = { user?: string; comment?: string; editor?: string; stats: string[] }

const feedSources: Record<string, (item: string) => Details> = {
  'osmcha.org': (item) => {
    const description = text(item, 'description')
    return {
      user: /^Changeset \d+ by (.+)$/.exec(text(item, 'title'))?.[1],
      comment: description.split('<br>Create: ')[0],
      stats: description.match(/Create: \d+, Modify: \d+, Delete: \d+/g) ?? [],
    }
  },
  'simon04.dev.openstreetmap.org': (item) => {
    const description = text(item, 'description')
    return {
      user: text(item, 'author'),
      comment: text(item, 'title'),
      editor: / using (.+?), titled "/.exec(description)?.[1],
      stats: description.match(/\w+: \d+ created, \d+ modified, \d+ deleted/g) ?? [],
    }
  },
}

/** The only check on `url`: https and a known host, so the route cannot be used to fetch anything else. */
export const parseFeedUrl = (input: string | null) => {
  try {
    const url = new URL(input ?? '')
    return url.protocol === 'https:' && Object.hasOwn(feedSources, url.host) ? url : null
  } catch {
    return null
  }
}

const decodeEntities = (xml: string) =>
  xml
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

const element = (xml: string, tag: string) =>
  new RegExp(`<${tag}[^>]*>([^]*?)</${tag}>`).exec(xml) ?? ['', '']

const raw = (xml: string, tag: string) => element(xml, tag)[0]
const text = (xml: string, tag: string) => decodeEntities(element(xml, tag)[1] ?? '').trim()

// `polygon` is the changeset bbox as `lat lon lat lon …`; the links open at its center.
const locationLinks = (polygon: string) => {
  if (!polygon) return []
  const numbers = polygon.split(' ').map(Number)
  const lats = numbers.filter((_, index) => index % 2 === 0)
  const lons = numbers.filter((_, index) => index % 2 === 1)
  const lat = ((Math.min(...lats) + Math.max(...lats)) / 2).toFixed(5)
  const lon = ((Math.min(...lons) + Math.max(...lons)) / 2).toFixed(5)
  return [
    ['Edit area in iD', `https://www.openstreetmap.org/edit?editor=id#map=18/${lat}/${lon}`],
    ['Edit area in Rapid', `https://rapideditor.org/edit#map=18/${lat}/${lon}`],
    ['Spyglass', `https://spyglass.jochentopf.com/#p=17/${lat}/${lon}`],
  ] satisfies Link[]
}

const transformItem = (item: string, feedUrl: URL) => {
  const id = /changesets?\/(\d+)/.exec(`${text(item, 'guid')} ${text(item, 'link')}`)?.[1]
  if (!id) return item

  const { user, comment, editor, stats } = feedSources[feedUrl.host]?.(item) ?? { stats: [] }
  // OSMCha feeds belong to a saved filter (AOI). Its id is part of the feed url and keeps the filter active.
  const aoiId = /\/aoi\/([^/]+)\//.exec(feedUrl.pathname)?.[1]
  const aoiSearch = aoiId ? `?aoi=${aoiId}` : ''
  const osmcha2Link = `${OSMCHA2_URL}/changesets/${id}${aoiSearch}`

  // Same targets as the "Open in" menu of OSMCha2 (`src/components/changeset/openInUrls.ts` there).
  const links: Link[] = [
    ['OSMCha2', osmcha2Link],
    ['OSMCha', `https://osmcha.org/changesets/${id}/${aoiSearch}`],
    ['OpenStreetMap', `https://www.openstreetmap.org/changeset/${id}`],
    ['Achavi', `https://overpass-api.de/achavi/?changeset=${id}&relations=true`],
    ['WhoDidIt', `https://simon04.dev.openstreetmap.org/whodidit/?changeset=${id}&show=1`],
    ['ResultMaps', `https://resultmaps.neis-one.org/osm-change-viz?c=${id}`],
    ['OSM Revert', `https://revert.monicz.dev/?changesets=${id}`],
    ['Level0', `http://level0.osmz.ru/?url=changeset/${id}`],
    [
      'JOSM',
      `http://127.0.0.1:8111/import?url=https://www.openstreetmap.org/api/0.6/changeset/${id}/download`,
    ],
    ...locationLinks(text(item, 'georss:polygon')),
    ...(user
      ? ([
          [
            'User on OpenStreetMap',
            `https://www.openstreetmap.org/user/${encodeURIComponent(user)}`,
          ],
          ['User on HDYC', `https://hdyc.neis-one.org/?${encodeURIComponent(user)}`],
        ] satisfies Link[])
      : []),
  ]

  const description = [
    `<p>${escapeXml(comment ?? '')}</p>`,
    `<p>${escapeXml([`Changeset ${id}`, user && `by ${user}`, editor && `using ${editor}`].filter(Boolean).join(' '))}</p>`,
    `<ul>${stats.map((line) => `<li>${escapeXml(line)}</li>`).join('')}</ul>`,
    `<ul>${links.map(([label, href]) => `<li><a href="${escapeXml(href)}">${label}</a></li>`).join('')}</ul>`,
  ].join('')

  // `guid` is taken over verbatim, so readers keep recognising entries they know from the source feed.
  return `<item>
<title>${escapeXml([user, comment || `Changeset ${id}`].filter(Boolean).join(': '))}</title>
<link>${escapeXml(osmcha2Link)}</link>
${raw(item, 'guid')}
${raw(item, 'pubDate')}
<description><![CDATA[${description}]]></description>
${raw(item, 'georss:polygon')}
</item>`
}

export const transformChangesetFeed = (xml: string, feedUrl: URL) => {
  const [channelHead = '', ...items] = xml.split(/(?=<item>)/)
  if (!channelHead.includes('<channel>')) throw new Error('Not an RSS feed')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:georss="http://www.georss.org/georss">
<channel>
<title>${escapeXml(text(channelHead, 'title'))} (OSMCha2)</title>
<link>${OSMCHA2_URL}</link>
<description>${escapeXml(`Changesets with links to OSMCha2 and other tools. Source: ${feedUrl.href}`)}</description>
${items.map((part) => transformItem(raw(part, 'item'), feedUrl)).join('\n')}
</channel>
</rss>`
}
