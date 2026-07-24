export class RegionNotFoundError extends Error {
  constructor(slug: string) {
    super(`Region not found: ${slug}`)
    this.name = 'RegionNotFoundError'
  }
}
