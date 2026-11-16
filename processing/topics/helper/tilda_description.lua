-- `description` on roads, paths and bikelanes is owned by TILDA:
--   TILDA_<hint>=<value>;TILDA_<hint>;OSM-`description`: <text>;OSM-`note`: <text>
-- Hint tokens come first, in the order they were added; the app translates them (topic docs of `description`).
-- Token values are sanitized values from an allowlist, never free text.
-- The OSM texts come last, `description` before `note`, each with its prefix. They are passed through
-- as tagged (only `safe_string`) and may contain `;`; the app splits only before ``;OSM-`note`: ``.
-- A `note` that repeats the `description` is left out.
local SANITIZE_TAGS = require('topics.helper.sanitize_tags')

local HINTS_KEY = '_tilda_hints'
local OSM_TEXT_KEYS = { 'description', 'note' }

--- `note` is skipped when it only repeats `description`; case, spaces and punctuation do not count.
--- A text of only spaces and punctuation is compared as it is.
---@param text string
---@return string
local function comparable_text(text)
  local comparable = text:lower():gsub('[%s%p]', '')
  if comparable == '' then return text end
  return comparable
end

---@param name string
---@param value string|nil
---@return string
local function token(name, value)
  if value == nil then return 'TILDA_' .. name end
  return 'TILDA_' .. name .. '=' .. value
end

---@param tags table
---@return string[]
local function hints(tags)
  return tags[HINTS_KEY] or {}
end

--- Adds a hint token to the tags. The list is copied, so tags copied from these tags keep their own list.
---@param tags table
---@param hint string
local function add_hint(tags, hint)
  local list = {}
  for _, existing in ipairs(hints(tags)) do
    if existing == hint then return end
    table.insert(list, existing)
  end
  table.insert(list, hint)
  tags[HINTS_KEY] = list
end

---@param tags table
---@param extra_tokens string[]|nil tokens added after the hints on the tags
---@return string|nil
local function build(tags, extra_tokens)
  local parts = {}
  local seen = {}
  local function add(part)
    if seen[part] then return end
    seen[part] = true
    table.insert(parts, part)
  end
  for _, hint in ipairs(hints(tags)) do add(hint) end
  for _, extra_token in ipairs(extra_tokens or {}) do add(extra_token) end
  local seen_texts = {}
  for _, key in ipairs(OSM_TEXT_KEYS) do
    local text = SANITIZE_TAGS.safe_string(tags[key])
    if text ~= nil and text ~= '' and not seen_texts[comparable_text(text)] then
      seen_texts[comparable_text(text)] = true
      add('OSM-`' .. key .. '`: ' .. text)
    end
  end
  if #parts == 0 then return nil end
  return table.concat(parts, ';')
end

return {
  token = token,
  add_hint = add_hint,
  hints = hints,
  build = build,
}
