---
applyTo: '**/*.sql,**/*.prisma'
---

## General
- We use PostgreSQL with PostGIS 3.5 and pgrouting 3.8 (Version specified in `/docker-compose.yml`, eg. `pgrouting/pgrouting:17-3.5-3.8`)
- The schema `prisma` is managed by Prisma, see `/app/db/schema.prisma`; this holds sensitive data.
  - Use `npm run migrate:create` to create a migration for changes to the schema.prisma.
- The schema `public` is managed by `/processing` using osm2pgsql and custom .sql files; this data is recreated each night.
- The schema `data` is managed manually by manual imports.
- We have have the SQL Formatter VSCode (https://marketplace.visualstudio.com/items?itemName=ReneSaarsoo.sql-formatter-vsc) running

## Queries
- For things inside the NextJS app, use Prisma (Version specified in `/app/package.json`)
- For `/app/scripts` and `/processing` use the PostgreSQL Bun integration, see https://bun.com/docs/api/sql
- For your own LLM queries use your MCP server

## Query format
- Always prefix DB tables with the right schema, be very explicit. The format is `public."SomeTable"`
- Always quote tables and columns that use CamelCase, eg. `select foo."CamelCaseColumn" from…`
