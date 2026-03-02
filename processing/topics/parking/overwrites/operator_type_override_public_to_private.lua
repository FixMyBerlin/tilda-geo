require('init')
require('Set')

--[[
  OPERATOR TYPE OVERRIDE (manual list of way IDs)
  ===============================================
  This is a manual, intentional override — not derived from OSM tagging.

  This list contains OSM way IDs of parking areas that are in public ownership
  (operator:type=government/public) but are NOT on dedicated public street space
  (i.e. not on "straßenrechtlich gewidmeten Flächen" / publicly dedicated street
  space). Examples: parking on school grounds, other public-institution sites.

  In TILDA Parkraum we treat these as an exception: we do NOT count them as
  public parking. We overwrite their operator_type to "private" so they are
  excluded from public parking counts and semantics.

  Reason: We need to distinguish parking maintained by street authorities
  (dedicated street space) from parking maintained by other public actors
  (e.g. schools). OSM has no specific tag for this; this list lets us handle
  legal edge cases (leases, usage rights, etc.) without changing OSM tagging.
]]

return Set({
  280722511,
  1181107161,
  1436866501,
  1449997186,
  554658105,
  1189460019,
  1189460018,
  1312194144,
  1312194143,
  28637355,
  1110316822,
  1178379947,
  1178379948,
  1393653161,
  1476466613,
  1476466616,
  1476466615,
  1476466614,
  1078024007,
  1080337795,
  1081147143,
  1077757719,
  1474457447,
  1474457448,
  1474457450,
  1474457452,
  795557702,
  921396688,
  795557702,
  921396688,
  1426246887,
  1429173307,
  1429173308,
  387407638,
  1443057534,
  564196956,
  1182200455,
  1349798729,
  381961977,
  381961975,
  837113748,
  827713284,
  837113749,
  837113750,
  827713285,
  159744994,
  159744995,
  970497115,
  1149491892,
  1331982843,
  1331982840,
  192136418,
  538566467,
  14669347,
  846105215,
  846105216,
  186074343,
  318693071,
  269001572,
  151237882,
  417790675,
})
