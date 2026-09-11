import { osmApiPost } from './osmApiPost.server'

export async function createOsmNote(input: { lat: number; lon: number; text: string }) {
  return osmApiPost(
    '/notes.json',
    { lat: input.lat, lon: input.lon, text: input.text },
    'create OSM note',
  )
}
