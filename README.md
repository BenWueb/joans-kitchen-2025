# Joan's Kitchen

Next.js 16 recipe app backed by Postgres (Drizzle ORM), Better Auth, Vercel Blob photo storage, and Algolia search.

## Getting started

```bash
cp .env.example .env.local   # then fill in DATABASE_URL and BETTER_AUTH_SECRET
npm install
npm run db:migrate           # create tables
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Backend overview

| Concern | Implementation |
| --- | --- |
| Database | Postgres via Drizzle ORM (`src/db/schema.ts`, migrations in `drizzle/`): `recipes`, `recipe_notes`, `recipe_photos`, `favorites` plus the Better Auth tables |
| Auth | [Better Auth](https://better-auth.com): email/password + optional Google (`src/lib/auth.ts`, `src/lib/auth-client.ts`) |
| Photos | Vercel Blob in production, `public/uploads` in development (`src/lib/storage.ts`); images are downscaled in the browser and re-encoded to WebP by `sharp` on the server |
| Email | Resend HTTP API (`src/lib/email.ts`); logged to the console when `RESEND_API_KEY` is unset |
| Mutations | Route handlers under `src/app/api/**` (authorization is enforced there) |

Changing the schema: edit `src/db/schema.ts`, run `npm run db:generate`, commit the new SQL in `drizzle/`, then `npm run db:migrate`.

### Admins

Admin status is the `is_admin` column on the `user` table (it can't be set through the API):

```sql
update "user" set is_admin = true where email = 'you@example.com';
```

## Migrating existing Firebase data

1. Apply the schema to the target database: `npm run db:migrate`.
2. Download a Firebase service account key and set `FIREBASE_SERVICE_ACCOUNT_PATH` (see `.env.example`). Set `BLOB_READ_WRITE_TOKEN` so photos are re-hosted.
3. Preview with `npm run migrate:firebase -- --dry-run`, then run `npm run migrate:firebase` (add `--skip-photos` to leave photos on Firebase Storage).

Users, recipes (IDs preserved), favorites, notes and photos are copied; the script can be re-run safely. Google users keep working. Firebase password hashes can't be imported, so email/password users need to use **Forgot password** once.

## Deploying (Vercel)

Set the variables from `.env.example` in the project settings (`BETTER_AUTH_URL` = your production URL), add a Postgres database and a Blob store, and run `npm run db:migrate` against the production database.
