const proc = Bun.spawnSync(['bunx', 'prisma', 'generate'], {
  env: {
    ...process.env,
    DATABASE_HOST: '127.0.0.1',
    DATABASE_USER: 'ci',
    DATABASE_PASSWORD: 'ci',
    DATABASE_NAME: 'ci',
  },
  stdout: 'inherit',
  stderr: 'inherit',
})
process.exit(proc.exitCode ?? 1)
