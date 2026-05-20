# DB Migration Runner Skill

## Purpose

Manage database schema changes safely using Prisma ORM. Every schema change
must go through the migration pipeline — never alter the database manually.

## Prerequisites

- `DATABASE_URL` must be set in `.env.local` (see `AGENTS.md` env vars section)
- Prisma schema is at `securegate-temp/prisma/schema.prisma`
- All commands run from `securegate-temp/`

## Migration Workflow

### Development

```bash
# 1. Edit prisma/schema.prisma with your changes

# 2. Validate the schema
npx prisma validate

# 3. Generate and apply the migration
npx prisma migrate dev --name describe_the_change

# 4. Review the generated SQL in prisma/migrations/<timestamp>_describe_the_change/migration.sql
```

The `--name` flag creates a human-readable migration folder name. Use short
kebab-case descriptions: `--name add-email-verified-field`.

### Production

```bash
# Apply all pending migrations
npx prisma migrate deploy
```

Never run `prisma migrate dev` against a production database — it may reset data.

### Resetting the Database (Development Only)

```bash
# Drops and recreates the database, applies all migrations, runs seeds
npx prisma migrate reset
```

## Handling Common Scenarios

### Adding a new optional field

```prisma
model User {
  id            String   @id @default(cuid())
  // Existing fields...
  phoneNumber   String?  // ✅ nullable — backward compatible
}
```

### Adding a new required field (multi-step)

1. Add the field as optional (`String?`) and deploy
2. Backfill data for existing records
3. Change to required (`String`) in a second migration

### Renaming a field or model

Prisma does not detect renames automatically. Follow the Prisma docs for
`prisma migrate dev --create-only` and edit the generated SQL to use
`ALTER TABLE ... RENAME COLUMN`.

```bash
# Generate migration file without applying it
npx prisma migrate dev --create-only --name rename-field
# Then edit prisma/migrations/<timestamp>_rename-field/migration.sql
# Then apply it
npx prisma migrate dev
```

### Resolving migration history conflicts

When the migration history diverges (e.g. after switching git branches):

```bash
# Baseline to match the target branch's state
npx prisma migrate resolve --applied <migration_name>
# Or roll back a local migration
npx prisma migrate resolve --rolled-back <migration_name>
```

## Verifying Changes

After running a migration, confirm it worked:

```bash
# Open Prisma Studio for a visual check
npx prisma studio

# Or query directly
npx prisma db execute --stdin <<< "SELECT column_name FROM information_schema.columns WHERE table_name='User';"
```

## Data Migrations

When a schema change requires transforming existing data (e.g. splitting a
`fullName` field into `firstName` / `lastName`), write a one-shot script in
`prisma/scripts/` and run it separately from the schema migration:

```ts
// prisma/scripts/backfill-names.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ where: { firstName: null } });
  for (const user of users) {
    const [firstName, ...rest] = (user as any).fullName.split(" ");
    await prisma.user.update({
      where: { id: user.id },
      data: { firstName, lastName: rest.join(" ") || null },
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run with: `npx tsx prisma/scripts/backfill-names.ts`

## Seeding

Add seed data in `prisma/seed.ts` using the Prisma client:

```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.create({
    data: {
      email: "admin@securegate.dev",
      name: "Admin",
      passwordHash: "...",
    },
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Configure the seed command in `package.json`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Run with: `npx prisma db seed`

## Common Mistakes

- Editing migration SQL files after they've been applied to a shared database
- Running `prisma migrate dev` in production (use `prisma migrate deploy`)
- Forgetting to run `prisma generate` after schema changes (client types won't update)
- Making a new field required (`String` not `String?`) on an existing table with data
- Manually altering the database outside of Prisma migrations
