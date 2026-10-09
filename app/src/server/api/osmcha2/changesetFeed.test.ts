import { describe, expect, test } from 'vitest'
import { parseFeedUrl, transformChangesetFeed } from './changesetFeed'

const AOI_ID = '17e97d33-cdd1-4224-a77c-63b6cc2505f0'
const OSMCHA_URL = `https://osmcha.org/api/v1/aoi/${AOI_ID}/changesets/feed/`
const WHODIDIT_URL =
  'https://simon04.dev.openstreetmap.org/whodidit/scripts/rss.php?bbox=13.41,52.46,13.46,52.48'

const osmchaFeed = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:georss="http://www.georss.org/georss"><channel><title>Changesets of Area of Interest BiBi</title><link>https://osmcha.org/api/v1/aoi/${AOI_ID}/</link><item><title>Changeset 190220322 by Le &amp; Ma</title><link>https://osmcha.org/changesets/190220322/?aoi=${AOI_ID}</link><description>Roofs &amp; &lt;b&gt;more&lt;br&gt;Create: 0, Modify: 2, Delete: 1</description><pubDate>Thu, 08 Oct 2026 20:00:48 +0000</pubDate><guid>https://osmcha.org/changesets/190220322/?aoi=${AOI_ID}</guid><georss:polygon>48.943937 9.101845 48.943937 9.102258 48.944430 9.102258 48.944430 9.101845 48.943937 9.101845</georss:polygon></item></channel></rss>`

const whodiditFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
	<title>WhoDidIt Feed for BBOX [13.41,52.46,13.47,52.49]</title>
	<item>
		<title>Created a charging_station</title>
		<author>s-tikhomirov</author>
		<guid>https://www.openstreetmap.org/browse/changeset/190188331</guid>
		<link>https://www.openstreetmap.org/browse/changeset/190188331</link>
		<pubDate>Thu, 08 Oct 2026 09:19:01 +0000</pubDate>
		<description>User &lt;a href=&quot;https://www.openstreetmap.org/user/s-tikhomirov&quot;&gt;s-tikhomirov&lt;/a&gt; has uploaded &lt;a href=&quot;https://www.openstreetmap.org/browse/changeset/190188331&quot;&gt;a changeset&lt;/a&gt; in your watched area using CoMaps android 2026.08.31, titled &quot;Created a charging_station&quot;. &lt;br&gt;&lt;br&gt;Statistics:&lt;ul&gt;&lt;li&gt;Nodes: 1 created, 0 modified, 0 deleted&lt;/li&gt;&lt;li&gt;Ways: 0 created, 2 modified, 0 deleted&lt;/li&gt;&lt;/ul&gt;</description>
	</item>
	<item>
		<title>Not a changeset</title>
		<guid>https://example.com/other</guid>
	</item>
</channel>
</rss>`

// The route fetches whatever passes here, so other hosts have to be rejected.
describe('parseFeedUrl', () => {
  test.each([OSMCHA_URL, WHODIDIT_URL])('%s is allowed', (url) => {
    expect(parseFeedUrl(url)?.href).toBe(url)
  })

  test.each([
    'https://example.com/feed',
    `https://osmcha.org@example.com/api/v1/aoi/${AOI_ID}/changesets/feed/`,
    OSMCHA_URL.replace('https:', 'http:'),
    'osmcha',
    null,
  ])('%s is rejected', (url) => {
    expect(parseFeedUrl(url)).toBeNull()
  })
})

describe('transformChangesetFeed', () => {
  test('OSMCha entry links to OSMCha2 and keeps guid, date and geometry', () => {
    const feed = transformChangesetFeed(osmchaFeed, new URL(OSMCHA_URL))

    expect(feed).toContain('<title>Changesets of Area of Interest BiBi (OSMCha2)</title>')
    expect(feed).toContain('<title>Le &amp; Ma: Roofs &amp; &lt;b&gt;more</title>')
    expect(feed).toContain(
      `<link>https://tordans.github.io/osmcha2/changesets/190220322?aoi=${AOI_ID}</link>`,
    )
    expect(feed).toContain(`<guid>https://osmcha.org/changesets/190220322/?aoi=${AOI_ID}</guid>`)
    expect(feed).toContain('<pubDate>Thu, 08 Oct 2026 20:00:48 +0000</pubDate>')
    expect(feed).toContain('<georss:polygon>48.943937 9.101845')
    expect(feed).toContain(
      '<p>Roofs &amp; &lt;b&gt;more</p><p>Changeset 190220322 by Le &amp; Ma</p>',
    )
    expect(feed).toContain('<li>Create: 0, Modify: 2, Delete: 1</li>')
    expect(feed).toContain(`href="https://osmcha.org/changesets/190220322/?aoi=${AOI_ID}"`)
    expect(feed).toContain('href="https://www.openstreetmap.org/user/Le%20%26%20Ma"')
    expect(feed).toContain(
      'href="https://www.openstreetmap.org/edit?editor=id#map=18/48.94418/9.10205"',
    )
    expect(feed).toContain('href="https://rapideditor.org/edit#map=18/48.94418/9.10205"')
    expect(feed).toContain('href="https://spyglass.jochentopf.com/#p=17/48.94418/9.10205"')
    expect(feed).toContain('href="https://revert.monicz.dev/?changesets=190220322"')
    expect(feed).toContain('api/0.6/changeset/190220322/download"')
  })

  test('WhoDidIt entry reads user, editor and statistics; unknown entries stay unchanged', () => {
    const feed = transformChangesetFeed(whodiditFeed, new URL(WHODIDIT_URL))

    expect(feed).toContain('<title>s-tikhomirov: Created a charging_station</title>')
    expect(feed).toContain('<link>https://tordans.github.io/osmcha2/changesets/190188331</link>')
    expect(feed).toContain('href="https://osmcha.org/changesets/190188331/"')
    expect(feed).toContain('<guid>https://www.openstreetmap.org/browse/changeset/190188331</guid>')
    expect(feed).toContain(
      'Changeset 190188331 by s-tikhomirov using CoMaps android 2026.08.31</p>',
    )
    expect(feed).toContain('<li>Nodes: 1 created, 0 modified, 0 deleted</li>')
    expect(feed).toContain('<li>Ways: 0 created, 2 modified, 0 deleted</li>')
    // No changeset geometry in this feed, so no links that need a position.
    expect(feed).not.toContain('rapideditor.org')
    expect(feed).toContain('<title>Not a changeset</title>')
  })

  test('a response that is not RSS throws', () => {
    expect(() => transformChangesetFeed('<html></html>', new URL(OSMCHA_URL))).toThrow()
  })
})
