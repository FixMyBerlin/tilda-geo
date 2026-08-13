/** After restoreVerify has committed the live table, later bookkeeping errors must not mark FAILED. */
export function shouldRecordImportAsFailed(restoreCommitted: boolean) {
  return restoreCommitted === false
}
