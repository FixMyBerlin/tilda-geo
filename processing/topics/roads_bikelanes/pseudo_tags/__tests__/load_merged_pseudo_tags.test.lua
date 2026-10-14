describe('load_merged_pseudo_tags', function()
  local load_merged_pseudo_tags = require('topics.roads_bikelanes.pseudo_tags.load_merged_pseudo_tags')
  local table_size = require('topics.helper.table_size')

  local mapillary_csv =
    '/processing/topics/roads_bikelanes/pseudo_tags/__tests__/test_mapillary_coverage.csv'

  it('merges mapillary rows into one lookup table', function()
    local original_sidepath = '/data/pseudoTagsData/is_sidepath_estimation.csv'
    local original_mapillary = '/data/pseudoTagsData/mapillary_coverage.csv'

    os.execute('mkdir -p /data/pseudoTagsData')
    os.execute('touch /data/pseudoTagsData/is_sidepath_estimation.csv')
    os.execute('cp ' .. mapillary_csv .. ' /data/pseudoTagsData/mapillary_coverage.csv')

    local data = load_merged_pseudo_tags()
    local merged = data:get()

    assert.are.equal(table_size(merged), 3)
    assert.are.equal(merged[123].mapillary_coverage, 'pano')
    assert.are.equal(merged[456].mapillary_coverage, 'regular')

    os.execute('cp ' .. original_mapillary .. ' /data/pseudoTagsData/mapillary_coverage.csv 2>/dev/null')
    os.execute('cp ' .. original_sidepath .. ' /data/pseudoTagsData/is_sidepath_estimation.csv 2>/dev/null')
  end)

  it('merges sidepath rows (value + optional CQI columns) into the same lookup table', function()
    os.execute('mkdir -p /data/pseudoTagsData')
    -- Truncate the other CSVs so this test is isolated regardless of run order.
    assert(io.open('/data/pseudoTagsData/mapillary_coverage.csv', 'w')):close()
    assert(io.open('/data/pseudoTagsData/settlement_area_estimation.csv', 'w')):close()

    local f = assert(io.open('/data/pseudoTagsData/is_sidepath_estimation.csv', 'w'))
    f:write('osm_id,is_sidepath_estimation,adjoining_road,adjoining_maxspeed\n')
    f:write('11,true,,\n')
    f:write('22,true,secondary,50\n')
    f:close()

    local merged = load_merged_pseudo_tags():get()

    assert.are.equal(table_size(merged), 2)
    assert.are.equal(merged[11].is_sidepath_estimation, 'true')
    assert.is_nil(merged[11].adjoining_road)
    assert.are.equal(merged[22].is_sidepath_estimation, 'true')
    assert.are.equal(merged[22].adjoining_road, 'secondary')
    assert.are.equal(merged[22].adjoining_maxspeed, '50')
  end)
  it('merges radnetz_berlin rows per id suffix and translates V/E/S', function()
    os.execute('mkdir -p /data/pseudoTagsData')
    assert(io.open('/data/pseudoTagsData/mapillary_coverage.csv', 'w')):close()
    assert(io.open('/data/pseudoTagsData/is_sidepath_estimation.csv', 'w')):close()
    finally(function() os.remove('/data/pseudoTagsData/infravelo_netz.csv') end)

    local f = assert(io.open('/data/pseudoTagsData/infravelo_netz.csv', 'w'))
    f:write('osm_id,id_suffix,infravelo_netz\n')
    f:write('812944114,,V\n')
    f:write('4425411,cycleway/left,E\n')
    f:write('4425411,cycleway/right,S\n')
    f:write('99,,X\n')
    f:close()

    local merged = load_merged_pseudo_tags():get()

    assert.are.same({ [''] = 'Vorrangnetz' }, merged[812944114].radnetz_berlin)
    assert.are.same(
      { ['cycleway/left'] = 'Ergänzungsnetz', ['cycleway/right'] = 'Sonstiges' },
      merged[4425411].radnetz_berlin
    )
    assert.is_nil(merged[4425411].radnetz_berlin[''])
    assert.is_nil(merged[99])
  end)
end)
