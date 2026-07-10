const rgbaToCss = (rgba) => `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})`

const dedupeLegendRules = (rules) => {
  const seen = new Set()
  const entries = []

  for (const rule of rules) {
    const legendValue = rule.style?.legendValue
    if (!legendValue) continue

    if (seen.has(legendValue)) continue
    seen.add(legendValue)
    entries.push(rule)
  }

  return entries
}

const createLineSwatch = (style) => {
  const el = document.createElement('span')
  el.className = 'legend-swatch legend-swatch-line'
  el.style.backgroundColor = style.lineStrokeColor ? rgbaToCss(style.lineStrokeColor) : '#4B5563'
  el.style.height = `${Math.max(2, Math.min(style.lineStrokeWidth ?? 4, 8))}px`
  return el
}

const createPolygonSwatch = (style) => {
  const el = document.createElement('span')
  el.className = 'legend-swatch legend-swatch-polygon'
  if (style.polygonFillColor) {
    el.style.backgroundColor = rgbaToCss(style.polygonFillColor)
  }
  if (style.polygonStrokeColor) {
    el.style.borderColor = rgbaToCss(style.polygonStrokeColor)
    el.style.borderWidth = `${Math.max(1, Math.min(style.polygonStrokeWidth ?? 2, 4))}px`
    el.style.borderStyle = 'solid'
  }
  return el
}

const renderLegendSection = (container, title, rules, geometryType) => {
  const section = document.createElement('section')
  section.className = 'legend-section'

  const heading = document.createElement('h2')
  heading.textContent = title
  section.appendChild(heading)

  const list = document.createElement('ul')
  list.className = 'legend-list'

  for (const rule of dedupeLegendRules(rules)) {
    const item = document.createElement('li')
    const swatch =
      geometryType === 'LineString' ? createLineSwatch(rule.style) : createPolygonSwatch(rule.style)
    const label = document.createElement('span')
    label.textContent = rule.style.legendValue
    item.append(swatch, label)
    list.appendChild(item)
  }

  section.appendChild(list)
  container.appendChild(section)
}

window.renderLegendPanel = (legendStyles, containerId = 'legend-panel') => {
  const container = document.getElementById(containerId)
  if (!container) return

  container.replaceChildren()

  const title = document.createElement('h1')
  title.textContent = 'Legende'
  container.appendChild(title)

  const styleById = Object.fromEntries(legendStyles.map((style) => [style.styleId, style]))

  const street = styleById.tilda_parkings_parkbeschraenkungen_line
  const offStreet = styleById.tilda_off_street_parkbeschraenkungen_area

  if (street?.rules) {
    renderLegendSection(container, 'Straßenraum', street.rules, 'LineString')
  }

  if (offStreet?.rules) {
    renderLegendSection(container, 'Abseits des Straßenraums', offStreet.rules, 'Polygon')
  }
}
