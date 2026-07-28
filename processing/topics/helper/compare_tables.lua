-- @desc Determines whether the contents of two tables match or not by concatenating their elements into strings and comparing them.
-- Thanks at https://stackoverflow.com/a/20326368/729221
function compare_table_values(a, b)
  return table.concat(a) == table.concat(b)
end

-- @desc Compare tables key+value by string concatenation.
function compare_tables(table_one, table_two)
  if not table_one or not table_two then
    return false
  end

  local table_one_string = ''
  local table_two_string = ''

  local table_a_keys_sorted = {}
  for k in pairs(table_one) do table.insert(table_a_keys_sorted, k) end
  table.sort(table_a_keys_sorted)

  local table_b_keys_sorted = {}
  for k in pairs(table_two) do table.insert(table_b_keys_sorted, k) end
  table.sort(table_b_keys_sorted)

  for _, k in ipairs(table_a_keys_sorted) do
    table_one_string = table_one_string .. tostring(k) .. tostring(table_one[k])
  end

  for _, k in ipairs(table_b_keys_sorted) do
    table_two_string = table_two_string .. tostring(k) .. tostring(table_two[k])
  end

  return table_one_string == table_two_string
end
