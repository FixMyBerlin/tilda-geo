#!/usr/bin/env bun
import path from 'node:path'

const previewRoot = import.meta.dir
const packageRoot = path.dirname(previewRoot)
const port = Number(process.env.PORT ?? 3456)

const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
}

const resolveFile = async (urlPath: string) => {
  if (urlPath === '/' || urlPath === '') {
    return Bun.file(path.join(previewRoot, 'index.html'))
  }

  if (urlPath.startsWith('/output/')) {
    return Bun.file(path.join(packageRoot, urlPath.slice(1)))
  }

  return Bun.file(path.join(previewRoot, urlPath.replace(/^\//, '')))
}

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url)
    const file = await resolveFile(decodeURIComponent(url.pathname))

    if (!(await file.exists())) {
      return new Response('Not found', { status: 404 })
    }

    const ext = path.extname(file.name ?? url.pathname)
    return new Response(file, {
      headers: {
        'Content-Type': contentTypes[ext] ?? 'application/octet-stream',
      },
    })
  },
})

console.log(`Preview: http://localhost:${port}`)
