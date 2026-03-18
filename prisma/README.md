# Prisma

The main entrypoint for the database + ORM is [schema.prisma](/api/prisma/schema.prisma) and [prisma.config.ts](/api/prisma.config.ts).



## Generate Prisma Client

```bash
npx prisma generate
```

## Migration

```bash
npx prisma migrate dev
```

## Seeding

To seed your database in v7, you must explicitly run:

```bash
npx prisma db seed
```

## Note:

- `migrate dev` and `db push` no longer run `prisma generate` automatically. You must run `prisma generate` explicitly to generate Prisma Client.
