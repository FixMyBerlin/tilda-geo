
-- Shared error kinds for all topic `*_errors` tables: each `key` is `_error_type` in stored tags;
-- `instruction` is `_instruction` (defined once per kind so key and text stay aligned).
return {
  SANITIZED_VALUE = {
    key = 'SANITIZED_VALUE',
    instruction =
      'These tags have values that were not accepted by our sanitization. Please review the values, fix the data, or update the sanitization.',
  },
  REWRITTEN_VALUE = {
    key = 'REWRITTEN_VALUE',
    instruction =
      'These tags have values with a clear mistake that we corrected in our data (e.g. weekday spelling, a time without leading zero, a duration without unit). Please fix the values in OSM.',
  },
  RELATION = {
    key = 'RELATION',
    instruction =
      'This is a relation that would be processed as a multipolygon. Multipolygons are not supported in our processing. Please restructure the data to use separate areas instead.',
  },
}
