describe('classify_sealing', function()
  require('topics.helper.osm2pgsql')
  local classify = require('topics.sealing.helper.classify_sealing')

  describe('classify_polygon', function()
    it('sealed surfaces are group A, explicit', function()
      for _, surface in ipairs({
        'asphalt', 'concrete', 'concrete:plates', 'concrete:lanes', 'paving_stones', 'paved', 'sett',
        'cobblestone', 'unhewn_cobblestone',
      }) do
        local result = classify.classify_polygon({ area = 'yes', highway = 'pedestrian', surface = surface })
        assert.are.equal('A', result.sealing_group, surface)
        assert.is_true(result.surface_explicit, surface)
      end
    end)

    it('grass_paver is A2', function()
      local result = classify.classify_polygon({ amenity = 'parking', parking = 'surface', surface = 'grass_paver' })
      assert.are.equal('A2', result.sealing_group)
      assert.is_true(result.surface_explicit)
    end)

    it('unsealed surfaces are group D, also on a type that defaults to B', function()
      for _, surface in ipairs({
        'gravel', 'fine_gravel', 'compacted', 'sand', 'ground', 'dirt', 'earth', 'grass', 'unpaved',
        'pebblestone', 'woodchips', 'mud',
      }) do
        local result = classify.classify_polygon({ amenity = 'parking', parking = 'surface', surface = surface })
        assert.are.equal('D', result.sealing_group, surface)
        assert.is_true(result.surface_explicit, surface)
      end
    end)

    it('an explicit sealed surface wins over a D type default', function()
      local result = classify.classify_polygon({ leisure = 'park', surface = 'asphalt' })
      assert.are.same({ sealing_group = 'A', surface_explicit = true, surface = 'asphalt' }, result)
    end)

    it('stores the sanitized surface value', function()
      local result = classify.classify_polygon({ place = 'square', surface = 'cobblestone' })
      assert.are.equal('large_sett', result.surface)
      assert.are.equal('A', result.sealing_group)
      local ground = classify.classify_polygon({ place = 'square', surface = 'dirt' })
      assert.are.equal('ground', ground.surface)
      assert.are.equal('D', ground.sealing_group)
    end)

    it('type defaults B', function()
      for _, tags in ipairs({
        { highway = 'pedestrian', area = 'yes' },
        { place = 'square' },
        { ['area:highway'] = 'footway' },
        { ['area:highway'] = 'pedestrian' },
        { ['area:highway'] = 'cycleway' },
        { amenity = 'parking', parking = 'surface' },
        { amenity = 'parking', parking = 'street_side' },
        { amenity = 'parking', parking = 'lane' },
        { amenity = 'parking' },
      }) do
        local result = classify.classify_polygon(tags)
        assert.are.equal('B', result.sealing_group)
        assert.is_false(result.surface_explicit)
        assert.is_nil(result.surface)
      end
    end)

    it('type defaults D', function()
      for _, tags in ipairs({
        { natural = 'sand' }, { natural = 'bare_rock' }, { natural = 'scree' }, { natural = 'beach' },
        { natural = 'scrub' }, { natural = 'grassland' }, { natural = 'wood' },
        { landuse = 'construction' }, { landuse = 'brownfield' }, { landuse = 'quarry' },
        { landuse = 'landfill' }, { landuse = 'grass' }, { landuse = 'meadow' }, { landuse = 'flowerbed' },
        { landuse = 'village_green' }, { landuse = 'cemetery' }, { landuse = 'allotments' },
        { leisure = 'park' }, { leisure = 'garden' },
      }) do
        local result = classify.classify_polygon(tags)
        assert.are.equal('D', result.sealing_group)
        assert.is_false(result.surface_explicit)
      end
    end)

    it('an unknown or multi-value surface counts as no surface', function()
      local unknown = classify.classify_polygon({ place = 'square', surface = 'bananas' })
      assert.are.same({ sealing_group = 'B', surface_explicit = false, surface = nil }, unknown)
      local multi = classify.classify_polygon({ leisure = 'park', surface = 'asphalt;gravel' })
      assert.are.same({ sealing_group = 'D', surface_explicit = false, surface = nil }, multi)
    end)

    it('footway/cycleway areas and pedestrian relations are B', function()
      assert.are.equal('B', classify.classify_polygon({ area = 'yes', highway = 'footway' }).sealing_group)
      assert.are.equal('B', classify.classify_polygon({ area = 'yes', highway = 'cycleway' }).sealing_group)
      assert.are.equal('B', classify.classify_polygon({ highway = 'pedestrian' }, true).sealing_group)
    end)

    it('bricks, stone and paving_stones:lanes are sealed', function()
      for _, surface in ipairs({ 'bricks', 'stone', 'paving_stones:lanes' }) do
        assert.are.equal('A', classify.classify_line({ highway = 'footway', surface = surface }).sealing_group)
      end
    end)

    it('forest, heath, wetland, farmland, orchard and vineyard are D', function()
      for _, tags in ipairs({
        { landuse = 'forest' }, { landuse = 'farmland' }, { landuse = 'orchard' }, { landuse = 'vineyard' },
        { natural = 'heath' }, { natural = 'wetland' },
      }) do
        assert.are.equal('D', classify.classify_polygon(tags).sealing_group)
      end
    end)

    it('skips polygons without type default or surface', function()
      assert.is_nil(classify.classify_polygon({ highway = 'pedestrian' }))
      assert.is_nil(classify.classify_polygon({ amenity = 'parking', parking = 'multi-storey' }))
      assert.is_nil(classify.classify_polygon({ landuse = 'residential' }))
    end)

    it('emits an explicit surface on area-type objects without a type default', function()
      assert.are.equal('A', classify.classify_polygon({ area = 'yes', highway = 'footway', surface = 'paving_stones' }).sealing_group)
      assert.are.equal('A', classify.classify_polygon({ area = 'yes', surface = 'asphalt' }).sealing_group)
      assert.are.equal('A', classify.classify_polygon({ amenity = 'parking', parking = 'street_side', surface = 'asphalt' }).sealing_group)
      assert.are.equal('A', classify.classify_polygon({ leisure = 'pitch', surface = 'asphalt' }).sealing_group)
      assert.are.equal('D', classify.classify_polygon({ landuse = 'orchard', surface = 'grass' }).sealing_group)
    end)

    it('skips buildings, roads and barriers with a surface', function()
      assert.is_nil(classify.classify_polygon({ building = 'yes', surface = 'asphalt' }))
      assert.is_nil(classify.classify_polygon({ building = 'yes', amenity = 'parking', parking = 'surface' }))
      assert.is_nil(classify.classify_polygon({ highway = 'residential', surface = 'asphalt' }))
      assert.is_nil(classify.classify_polygon({ highway = 'service', area = 'yes', surface = 'asphalt' }))
      assert.is_nil(classify.classify_polygon({ barrier = 'wall', area = 'yes', surface = 'asphalt' }))
      assert.is_nil(classify.classify_polygon({ natural = 'water', surface = 'asphalt' }))
    end)

    it('excludes carriageway area:highway entirely, also with a surface', function()
      assert.is_nil(classify.classify_polygon({ ['area:highway'] = 'residential' }))
      assert.is_nil(classify.classify_polygon({ ['area:highway'] = 'service', surface = 'asphalt' }))
      assert.is_nil(classify.classify_polygon({ ['area:highway'] = 'primary', area = 'yes', surface = 'asphalt' }))
    end)

    it('skips parking that is not at ground level, also with a surface', function()
      assert.is_nil(classify.classify_polygon({ amenity = 'parking', parking = 'underground', surface = 'asphalt' }))
      assert.is_nil(classify.classify_polygon({ amenity = 'parking', parking = 'multi-storey', surface = 'concrete' }))
    end)
  end)

  describe('is_area_way', function()
    it('area=yes|no decides', function()
      assert.is_true(classify.is_area_way({ highway = 'footway', area = 'yes' }))
      assert.is_false(classify.is_area_way({ landuse = 'grass', area = 'no' }))
    end)

    it('closed highways are lines without area=yes', function()
      assert.is_false(classify.is_area_way({ highway = 'footway' }))
      assert.is_false(classify.is_area_way({ highway = 'pedestrian' }))
    end)

    it('area-type keys make an area', function()
      assert.is_true(classify.is_area_way({ place = 'square' }))
      assert.is_true(classify.is_area_way({ amenity = 'parking' }))
      assert.is_true(classify.is_area_way({ ['area:highway'] = 'footway' }))
      assert.is_true(classify.is_area_way({ leisure = 'park' }))
      assert.is_true(classify.is_area_way({ landuse = 'grass' }))
      assert.is_true(classify.is_area_way({ natural = 'wood' }))
    end)

    it('tree rows and untyped closed ways are no areas', function()
      assert.is_false(classify.is_area_way({ natural = 'tree_row' }))
      assert.is_false(classify.is_area_way({ barrier = 'fence' }))
    end)
  end)

  describe('classify_line', function()
    it('default widths by highway type, source default', function()
      local expected = { footway = 2.5, cycleway = 2.0, path = 2.0, pedestrian = 8.0, living_street = 5.0 }
      for highway, width in pairs(expected) do
        local result = classify.classify_line({ highway = highway, surface = 'asphalt' })
        assert.are.equal(width, result.width_m, highway)
        assert.are.equal('default', result.width_source, highway)
      end
    end)

    it('uses the parsed width tag', function()
      local result = classify.classify_line({ highway = 'footway', footway = 'sidewalk', width = '1.8' })
      assert.are.equal(1.8, result.width_m)
      assert.are.equal('tag', result.width_source)
      local cm = classify.classify_line({ highway = 'cycleway', width = '250 cm' })
      assert.are.equal(2.5, cm.width_m)
    end)

    it('falls back to the default for unusable or insane widths', function()
      for _, width in ipairs({ 'wide', '0', '-2', '0.1', '100', '5 ft' }) do
        local result = classify.classify_line({ highway = 'footway', width = width })
        assert.are.equal(2.5, result.width_m, width)
        assert.are.equal('default', result.width_source, width)
      end
    end)

    it('without surface: B, except path which is not emitted', function()
      local result = classify.classify_line({ highway = 'footway', footway = 'sidewalk' })
      assert.are.equal('B', result.sealing_group)
      assert.is_false(result.surface_explicit)
      assert.is_nil(classify.classify_line({ highway = 'path' }))
      assert.is_nil(classify.classify_line({ highway = 'path', surface = 'bananas' }))
    end)

    it('with surface: A, A2, D, explicit, also on a path', function()
      local a = classify.classify_line({ highway = 'path', surface = 'asphalt' })
      assert.are.equal('A', a.sealing_group)
      assert.is_true(a.surface_explicit)
      assert.are.equal('asphalt', a.surface)
      assert.are.equal('A2', classify.classify_line({ highway = 'footway', surface = 'grass_paver' }).sealing_group)
      local d = classify.classify_line({ highway = 'pedestrian', surface = 'gravel' })
      assert.are.equal('D', d.sealing_group)
      assert.is_true(d.surface_explicit)
    end)

    it('a multi-value surface counts as no surface', function()
      assert.are.equal('B', classify.classify_line({ highway = 'cycleway', surface = 'asphalt;gravel' }).sealing_group)
      assert.is_nil(classify.classify_line({ highway = 'path', surface = 'asphalt;gravel' }))
    end)

    it('skips other highways', function()
      assert.is_nil(classify.classify_line({ highway = 'residential', surface = 'asphalt' }))
      assert.is_nil(classify.classify_line({ highway = 'steps' }))
      assert.is_nil(classify.classify_line({}))
    end)
  end)

  describe('trees', function()
    it('node: crown from diameter_crown, else 8.0', function()
      local tagged = classify.classify_tree_node({ natural = 'tree', diameter_crown = '12' })
      assert.are.same({ sealing_group = 'tree', surface_explicit = false, crown_m = 12, crown_source = 'tag' }, tagged)
      local default = classify.classify_tree_node({ natural = 'tree' })
      assert.are.equal(8.0, default.crown_m)
      assert.are.equal('default', default.crown_source)
      assert.are.equal(8.0, classify.classify_tree_node({ natural = 'tree', diameter_crown = 'big' }).crown_m)
      assert.are.equal(8.0, classify.classify_tree_node({ natural = 'tree', diameter_crown = '200' }).crown_m)
    end)

    it('node: ignores a surface tag', function()
      local result = classify.classify_tree_node({ natural = 'tree', surface = 'asphalt' })
      assert.is_nil(result.surface)
      assert.is_false(result.surface_explicit)
    end)

    it('tree_row: group tree, width 6.0 default', function()
      local result = classify.classify_way_line({ natural = 'tree_row' })
      assert.are.same({
        sealing_group = 'tree', surface_explicit = false, width_m = 6.0, width_source = 'default',
      }, result)
    end)

    it('only natural=tree and natural=tree_row', function()
      assert.is_nil(classify.classify_tree_node({ natural = 'wood' }))
      assert.is_nil(classify.classify_tree_row({ natural = 'tree' }))
    end)
  end)

  describe('road sidewalks', function()
    it('sidewalk=both: two B rows, offset half road (8 m) + half sidewalk (2.5 m)', function()
      local result = classify.classify_road_sidewalks({ highway = 'residential', sidewalk = 'both' })
      assert.are.equal(2, #result)
      assert.are.equal('B', result[1].sealing_group)
      assert.are.equal(5.25, result[1].offset_m)
      assert.are.equal(-5.25, result[2].offset_m)
      assert.are.equal(2.5, result[1].width_m)
      assert.are.equal('default', result[1].width_source)
    end)

    it('one side, own width and surface', function()
      local result = classify.classify_road_sidewalks({
        highway = 'residential', ['sidewalk:right'] = 'yes', ['sidewalk:left'] = 'separate',
        ['sidewalk:right:width'] = '1.5', ['sidewalk:right:surface'] = 'paving_stones',
      })
      assert.are.equal(1, #result)
      assert.are.equal(-4.75, result[1].offset_m)
      assert.are.equal('A', result[1].sealing_group)
      assert.are.equal('tag', result[1].width_source)
    end)

    it('unsealed sidewalk surface counts as D', function()
      local result = classify.classify_road_sidewalks({
        highway = 'residential', sidewalk = 'left', ['sidewalk:surface'] = 'gravel',
      })
      assert.are.equal('D', result[1].sealing_group)
    end)

    it('nothing for separate, no, or non-road ways', function()
      assert.are.equal(0, #classify.classify_road_sidewalks({ highway = 'residential', sidewalk = 'separate' }))
      assert.are.equal(0, #classify.classify_road_sidewalks({ highway = 'residential', sidewalk = 'no' }))
      assert.are.equal(0, #classify.classify_road_sidewalks({ highway = 'footway', sidewalk = 'both' }))
      assert.are.equal(0, #classify.classify_road_sidewalks({ highway = 'residential' }))
    end)
  end)
end)
