require('init')
require('Log')
local test_csv_format = require('test_csv_format')
local assert = require('luassert')

describe('test_csv_format', function()
  local column_name = 'mapillary_coverage'

  it('fails when table is nil', function()
    assert.has_error(function()
      test_csv_format(nil, column_name)
    end)
  end)

  it('fails when table is empty', function()
    assert.has_error(function()
      test_csv_format({}, column_name)
    end)
  end)

  it('fails when missing osm_id column', function()
    local rows = { { foo = 1, [column_name] = 2 } }
    assert.has_error(function()
      test_csv_format(rows, column_name)
    end)
  end)

  it('fails when missing requested column', function()
    local rows = { { osm_id = 1, foo = 2 } }
    assert.has_error(function()
      test_csv_format(rows, column_name)
    end)
  end)

  it('passes with valid csv', function()
    local rows = { { osm_id = 1, [column_name] = 2 } }
    assert.has_no.errors(function()
      test_csv_format(rows, column_name)
    end)
  end)
end)
