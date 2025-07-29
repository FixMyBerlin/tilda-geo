function Lit(object_tags)
  local result_tags = {}

  -- Categorize the data in three groups: "lit", "unlit", "special"
  if object_tags.lit ~= nil then
    if (object_tags.lit == "yes" or object_tags.lit == "no") then
      result_tags.lit = object_tags.lit
    else
      result_tags.lit = "special"
    end
  end

  return result_tags
end
