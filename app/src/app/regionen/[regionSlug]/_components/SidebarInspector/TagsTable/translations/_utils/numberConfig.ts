// https://formatjs.io/docs/react-intl/components/#formattednumber
export const numberConfigs: { key: string; suffix?: string }[] = [
  { key: 'capacity', suffix: undefined },
  { key: 'capacity:cargo_bike', suffix: undefined },
  { key: 'capacity:disabled', suffix: undefined },
  { key: 'highway_width_proc_effective', suffix: 'm' }, // parkraumParkingStats
  { key: 'length', suffix: 'm' },
  { key: 'maxspeed', suffix: 'km/h' },
  { key: 'maxheight', suffix: 'm' },
  { key: 'population', suffix: 'Einwohner:innen' },
  { key: 'width', suffix: 'm' },
  { key: 'sum_km', suffix: 'km' }, // parkraumParkingStats
  { key: 'lane_km', suffix: 'km' }, // parkraumParkingStats
  { key: 'd_other_km', suffix: 'km' }, // parkraumParkingStats
  { key: 'on_kerb_km', suffix: 'km' }, // parkraumParkingStats
  { key: 'half_on_kerb_km', suffix: 'km' }, // parkraumParkingStats
  { key: 'street_side_km', suffix: 'km' }, // parkraumParkingStats
  { key: 'length_wo_dual_carriageway', suffix: 'km' }, // parkraumParkingStats
  { key: 'done_percent', suffix: '%' }, // parkraumParkingStats
  { key: 'admin_level', suffix: undefined },
  { key: 'maxstay', suffix: 'Minuten' }, // bietigheim-bissingen_parking_areas
  { key: 'parking:levels', suffix: 'Stockwerke' }, // bietigheim-bissingen_parking_areas
  { key: 'distance', suffix: 'km' }, // bikeroutes
  { key: 'buffer_left', suffix: 'm' }, // bikelanes
  { key: 'buffer_right', suffix: 'm' }, // bikelanes
  { key: 'tilda_osm_id', suffix: undefined }, // infravelo
  { key: 'tilda_width', suffix: 'm' }, // infravelo
  { key: 'radius', suffix: 'm' }, // parkings_cutouts
  { key: 'area', suffix: 'm²' }, // area values
  { key: 'circumference', suffix: 'm' }, // circumference values
  { key: 'buffer_radius', suffix: 'm' }, // buffer radius values
  // { key: 'direction', suffix: '°' }, // direction values in degrees – ERROR: Can be string as well
]
