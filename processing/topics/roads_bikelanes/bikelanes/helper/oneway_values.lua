local SET = require('topics.helper.sets')

-- Explicit one-way values of `oneway`, `oneway:bicycle` and `cycleway:<side>:oneway`.
-- `1` is the same as `yes`, `-1` is one-way against the drawing direction of the way.
-- https://wiki.openstreetmap.org/wiki/Key:oneway
local ONEWAY_VALUES = SET.set({ 'yes', '1', '-1' })

return ONEWAY_VALUES
