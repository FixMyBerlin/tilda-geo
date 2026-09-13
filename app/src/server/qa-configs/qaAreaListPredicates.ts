import {
  QA_STATUS_OPTIONS,
  QA_STATUS_SELECT_ALL,
  type QaStatusParam,
} from '@/components/regionen/pageRegionSlug/modes/qa/qaConfigStyles'

type SqlFragment = {
  sql: string
  params: string[]
}

/** Status filter on the latest-per-area CTE alias `l`. `'all'` / undefined → no constraint. */
export function qaStatusSqlPredicate(status: QaStatusParam | undefined, nextParamIndex: number) {
  if (status === undefined || status === QA_STATUS_SELECT_ALL) {
    return { sql: 'TRUE', params: [] } satisfies SqlFragment
  }
  const option = QA_STATUS_OPTIONS.find((entry) => entry.key === status)
  // Unreachable: `zodQaParamStatus` is built from these same options. Fail loudly rather than
  // falling back to no constraint, which would answer a status filter with every area.
  if (!option) {
    throw new Error(`Unknown QA status key: ${status}`)
  }

  const clauses: string[] = []
  const params: string[] = []
  let index = nextParamIndex

  if (option.userStatus === null) {
    clauses.push('l."userStatus" IS NULL')
  } else {
    clauses.push(`l."userStatus"::text = $${index}`)
    params.push(option.userStatus)
    index += 1
  }

  if (option.systemStatus !== null) {
    clauses.push(`l."systemStatus"::text = $${index}`)
    params.push(option.systemStatus)
  }

  return { sql: clauses.join(' AND '), params } satisfies SqlFragment
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

export const QA_ABSOLUTE_CHANGE_SORT_SQL = `CASE WHEN l."decisionData"->>'absoluteChange' ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN abs((l."decisionData"->>'absoluteChange')::numeric) END`
