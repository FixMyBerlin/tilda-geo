function to_date(tags_object, to_number_tags)
  for key, value in pairs(tags_object) do
    if to_number_tags[key] then
      tags_object[key] = os.date('!%Y-%m-%dT%H:%M:%SZ', value)
    end
  end
end
