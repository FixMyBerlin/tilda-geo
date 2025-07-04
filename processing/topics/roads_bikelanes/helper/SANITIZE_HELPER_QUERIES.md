# Helper Queries for Sanitizers

## All values for a given tag with osm_id|s

```sql
SELECT
  id,
  COALESCE(
    tags->>'osm_traffic_mode',
    tags->>'osm_traffic_mode:left',
    tags->>'osm_traffic_mode:right'
  ) AS osm_separation_value
FROM public.bikelanes
WHERE
  tags ? 'osm_traffic_mode'
  OR tags ? 'osm_traffic_mode:left'
  OR tags ? 'osm_traffic_mode:right';
```

## All values for a given tag with counts

```sql
SELECT
  value,
  COUNT(*) AS count
FROM (
  SELECT tags->>'osm_traffic_mode' AS value
  FROM public.bikelanes
  UNION ALL
  SELECT tags->>'osm_traffic_mode:left' AS value
  FROM public.bikelanes
  UNION ALL
  SELECT tags->>'osm_traffic_mode:right' AS value
  FROM public.bikelanes
) AS all_values
GROUP BY value
ORDER BY count DESC;
```

## All values WITH SEMICOLON for a given tag with osm_id|s

```sql

SELECT
  id,
  COALESCE(
    tags->>'osm_traffic_mode',
    tags->>'osm_traffic_mode:left',
    tags->>'osm_traffic_mode:right'
  ) AS osm_traffic_mode_value
FROM public.bikelanes
WHERE
  (
    tags->>'osm_traffic_mode' LIKE '%;%' OR
    tags->>'osm_traffic_mode:left' LIKE '%;%' OR
    tags->>'osm_traffic_mode:right' LIKE '%;%'
  );
```

## All values WITH SEMICOLON for a given tag with counts

```sql
SELECT
  value,
  COUNT(*) AS count
FROM (
  SELECT tags->>'osm_traffic_mode' AS value
  FROM public.bikelanes
  WHERE tags->>'osm_traffic_mode' LIKE '%;%'
  UNION ALL
  SELECT tags->>'osm_traffic_mode:left' AS value
  FROM public.bikelanes
  WHERE tags->>'osm_traffic_mode:left' LIKE '%;%'
  UNION ALL
  SELECT tags->>'osm_traffic_mode:right' AS value
  FROM public.bikelanes
  WHERE tags->>'osm_traffic_mode:right' LIKE '%;%'
) AS all_values
GROUP BY value
ORDER BY count DESC;
```
