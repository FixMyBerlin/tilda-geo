/** Virtual-hosted S3 object URL (`https://{bucket}.s3.{region}.amazonaws.com/{key}`). */
export function s3VirtualHostedUrl(input: { bucket: string; key: string; region?: string }) {
  const region = input.region ?? process.env.S3_REGION
  return `https://${input.bucket}.s3.${region}.amazonaws.com/${input.key}`
}
