import { $ } from 'bun'

const result = await $`bunx prisma generate`
  .env({
    ...process.env,
    DATABASE_HOST: '127.0.0.1',
    DATABASE_USER: 'ci',
    DATABASE_PASSWORD: 'ci',
    DATABASE_NAME: 'ci',
  })
  .nothrow()

process.exit(result.exitCode ?? 1)
