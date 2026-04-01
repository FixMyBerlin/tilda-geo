declare module '@rolldown/plugin-babel' {
  import type { Plugin } from 'vite'
  function babel(options?: { presets?: unknown[]; plugins?: unknown[] }): Plugin
  export default babel
}
