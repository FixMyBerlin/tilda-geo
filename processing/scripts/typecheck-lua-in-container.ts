#!/usr/bin/env nub
import { $ } from '../utils/sh'

const lualsVersion = process.env.LUALS_VERSION ?? '3.18.2'
const lualsDir = '/tmp/lua-language-server'
const lualsBin = `${lualsDir}/bin/lua-language-server`
const lualsLogDir = '/tmp/lua-language-server-logs'

const hasLuaLs = await $`test -x ${lualsBin}`.quiet().nothrow()
if (hasLuaLs.exitCode !== 0) {
  const archRaw = (await $`uname -m`.quiet()).text().trim()
  const arch =
    archRaw === 'x86_64' || archRaw === 'amd64'
      ? 'x64'
      : archRaw === 'aarch64' || archRaw === 'arm64'
        ? 'arm64'
        : null

  if (!arch) {
    console.error(`Unsupported architecture for LuaLS: ${archRaw}`)
    process.exit(1)
  }

  const tarName = `lua-language-server-${lualsVersion}-linux-${arch}.tar.gz`
  const url = `https://github.com/LuaLS/lua-language-server/releases/download/${lualsVersion}/${tarName}`

  await $`rm -rf ${lualsDir}`
  await $`mkdir -p ${lualsDir}`
  await $`curl -fsSL ${url} -o /tmp/lua-language-server.tgz`
  await $`tar -xzf /tmp/lua-language-server.tgz -C ${lualsDir}`
}

await $`mkdir -p ${lualsLogDir}`
await $`${lualsBin} --check /processing/topics --checklevel=Error --configpath=/processing/.luarc.typecheck.json --logpath=${lualsLogDir}`
