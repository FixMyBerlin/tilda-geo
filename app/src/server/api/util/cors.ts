/**
 * CORS for the API routes that are read from a browser on another origin: any origin may call
 * them. They use no cookies for that (send requests without `credentials`); the token or session
 * check and the member checks behind them are the access check.
 * `Allow-Methods` and `Allow-Headers` only belong to the preflight, see {@link preflightResponse}.
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  // Without this a browser app cannot read these headers of a cross-origin answer
  // (ETag for revalidation, Content-Range for PMTiles, Content-Disposition for downloads).
  'Access-Control-Expose-Headers': 'ETag, Content-Range, Content-Length, Content-Disposition',
}

export function preflightResponse(input: { methods: string; allowHeaders: string }) {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      'Access-Control-Allow-Methods': input.methods,
      'Access-Control-Allow-Headers': input.allowHeaders,
      'Access-Control-Max-Age': '600',
    },
  })
}
