export const KEY_IF_PRESENCE = '__if_present'

export const cleanKey = (key: string) => {
  return key.replace(KEY_IF_PRESENCE, '')
}
