# Chronicle database migrations

Chronicle's existing VPS PostgreSQL database was initially created using `prisma db push`. Do **not** run `prisma migrate deploy` with an initial CREATE TABLE migration until this database has been baselined.

## One-time baseline (run against the already-initialized Chronicle database)

1. Back up PostgreSQL before proceeding. Verify `DATABASE_URL` points to the correct Chronicle database.
2. On a trusted development checkout matching the *current production schema*:

   ```sh
   cd server
   mkdir -p prisma/migrations/0_init
   npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script -o prisma/migrations/0_init/migration.sql
   printf 'provider = "postgresql"\n' > prisma/migrations/migration_lock.toml
   ```

3. Review the SQL and compare the live database against the Prisma schema. Confirm there is no drift before baselining:

   ```sh
   npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
   ```

   Exit code 0 indicates no supported schema differences. Any other exit code requires investigation. Prisma schema diff does not cover all possible PostgreSQL features.

4. Copy the migration directory to the VPS under `/opt/chronicle/server/prisma/migrations`. On the VPS, run **once** (with the correct existing `.env` and `prisma.config.ts`):

   ```sh
   cd /opt/chronicle/server
   npx prisma migrate resolve --applied 0_init
   npx prisma migrate status
   ```

   This records the initial migration as applied; it must **not** recreate the existing tables.

5. Commit the reviewed `prisma/migrations/0_init/migration.sql` and `migration_lock.toml` files to GitHub before enabling automated migrations. The deployment workflow runs `prisma migrate deploy` only when `migration_lock.toml` exists.

## Subsequent schema changes

Run `npx prisma migrate dev --name describe_change` against a **development** database, inspect the generated SQL, and commit both the Prisma schema and migration files. On deployment, GitHub Actions copies migrations to the VPS and runs `prisma migrate deploy` before restarting Chronicle.

Do not use `prisma db push`, `prisma migrate dev`, `prisma migrate reset`, or destructive migration flags on production.

Prisma official docs: https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining
