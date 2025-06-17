
local function this_or_that(key, this, that)
  if this.value then
    return {
      [key] = this.value,
      [key .. '_confidence'] = this.confidence,
      [key .. '_source'] = this.source
    }
  elseif that.value then
    return {
      [key] = that.value,
      [key .. '_confidence'] = that.confidence,
      [key .. '_source'] = that.source
    }
  else
    return nil
  end
end

return this_or_that
