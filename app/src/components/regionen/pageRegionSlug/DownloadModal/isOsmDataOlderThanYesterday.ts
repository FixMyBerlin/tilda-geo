import { isBefore, subDays } from 'date-fns'

/**
 * `checkedAt` is when the processing metadata was fetched (`dataUpdatedAt` of the query), not the
 * clock at render: render has to give the same result each time, on the server and in the browser.
 */
export const isOsmDataOlderThanYesterday = (osmDataFrom: Date | string, checkedAt: Date | number) =>
  isBefore(osmDataFrom, subDays(checkedAt, 1))
