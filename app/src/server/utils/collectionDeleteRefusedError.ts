/**
 * A member delete of a note folder or review list was refused because of what the collection
 * holds or where it is linked, not because of the caller. The MCP tools add the next step to it.
 */
export class CollectionDeleteRefusedError extends Error {
  reason: 'notEmpty' | 'linkedToOtherRegions'

  constructor(reason: CollectionDeleteRefusedError['reason'], message: string) {
    super(message)
    this.name = 'CollectionDeleteRefusedError'
    this.reason = reason
  }
}
