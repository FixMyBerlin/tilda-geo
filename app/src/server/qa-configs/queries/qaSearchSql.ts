/** A SQL condition plus the params it binds, for callers composing a larger query. */
export type SqlFragment = {
  sql: string
  params: unknown[]
}

/** Case-insensitive search over area id, evaluator OSM name, and evaluation body. */
export function qaSearchSqlPredicate(search: string | undefined, nextParamIndex: number) {
  if (!search) {
    return { sql: 'TRUE', params: [] } satisfies SqlFragment
  }
  return {
    sql: `(l."areaId" ILIKE '%' || $${nextParamIndex} || '%' OR u."osmName" ILIKE '%' || $${nextParamIndex} || '%' OR l.body ILIKE '%' || $${nextParamIndex} || '%')`,
    params: [search],
  } satisfies SqlFragment
}
