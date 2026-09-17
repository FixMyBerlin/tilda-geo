/** Basename-only S3 key segment. Client `file.name` is attacker-controlled. */
export function sanitizeS3UploadFilename(filename: string, fallback = 'file') {
  const basename = filename.split(/[/\\]/).pop() ?? ''
  const cleaned = basename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '')
  return cleaned || fallback
}
