local SET = require('topics.helper.sets')
local SET = require('topics.helper.sets')

-- https://wiki.openstreetmap.org/wiki/DE:Key:highway
-- https://wiki.openstreetmap.org/wiki/Attribuierung_von_Stra%C3%9Fen_in_Deutschland
-- We keep the different highway classes separate so we can use them for filtering
-- to combine them use `join_sets` from `topics/helper/join_sets.lua`

-- '*_link' bedeutet 'Autobahnzubringer', 'Anschlussstelle', 'Auf- / Abfahrt'
local trunk_motorway_classes = SET.set({
  'motorway', 'motorway_link', -- 'Autobahn'
  'trunk', 'trunk_link',       -- 'Autobahnähnliche Straße', 'Schnellstraßen' (those have motorroad=yes)
})

local major_road_classes = SET.set({
  'primary', 'primary_link',     -- 'Bundesstraßen' (B XXX)
  'secondary', 'secondary_link', -- 'Landesstraße' (L XXX)
  'tertiary', 'tertiary_link',   -- 'Kreisstraße', 'Gemeindeverbindungsstraße', 'Innerstädtische Vorfahrtstraßen mit Durchfahrtscharakter'
})

local minor_road_classes = SET.set({
  'unclassified',  -- 'Nebenstraßen', 'Gemeindestraße mit Verbindungscharakter'
  'residential',   -- 'Straße an und in Wohngebieten'
  'road',          -- Ohne Klassifizierung
  'living_street', -- 'Verkehrsberuhigter Bereich', 'Spielstraße' traffic_sign=325.1 (Beginn), 326 (Ende)
  'pedestrian',    -- 'Fußgängerzone'
  'service',       -- 'Zufahrtswege', aber auch 'Grundstückszufahrt', Wege auf Parkplätzen, 'Drive trough', 'Gassen', 'Feuerwehzufahrt'
})

local path_classes = SET.set({
  'track',     -- 'Wirtschaftswege', 'Wald- und Feldwege'
  -- 'bridleway', -- 'Reitweg' -- We always filter bridleways
  'path',
  'footway',
  'cycleway',
  'steps',
})

-- Path-like for sidepath / presence / maxspeed logic: PathClasses + pedestrian
local sidepath_highway_classes_local = SET.join_sets({ path_classes, SET.set({ 'pedestrian' }) })

return {
  trunk_motorway_classes = trunk_motorway_classes,
  major_road_classes = major_road_classes,
  minor_road_classes = minor_road_classes,
  path_classes = path_classes,
  sidepath_highway_classes = sidepath_highway_classes_local,
}
