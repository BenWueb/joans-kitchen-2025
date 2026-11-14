# Joan's Kitchen - AI Coding Agent Instructions

## Project Overview

Next.js 16 recipe management app with a Postgres (Drizzle) backend, Better Auth, Vercel Blob photo storage, Algolia search, and Unsplash image integration. Uses App Router with mixed TypeScript (.tsx/.ts) and JavaScript (.jsx/.js) files.

## Architecture & Data Flow

### File Naming & Component Conventions

- **Mixed file extensions**: `.jsx` for auth/OAuth components, `.tsx` for everything else
- **Dynamic routes**: `[recipe]/page.tsx` converts underscored URLs to recipe titles (e.g., `Grilled_Chicken` → "grilled chicken")
- **Hook pattern**: Custom hooks in `src/hooks/` call the app's API routes and manage UI state (e.g., `useRecipeActions`, `usePhotoUpload`)
- **Component structure**: "Smart" components (with hooks) live in `src/components/`, pure layout components inline in pages

### Backend Integration

- **Database**: Postgres via Drizzle. Schema in `src/db/schema.ts` (`user`/`session`/`account`/`verification` for Better Auth, plus `recipes` and `favorites`). Migrations are generated into `drizzle/` with `npm run db:generate` and applied with `npm run db:migrate`.
- **Server reads** (server components): `src/lib/recipes.ts`. **Mutations** go through route handlers in `src/app/api/**`, which check the session via `getCurrentUser()` (`src/lib/session.ts`) and enforce permissions (admin-only field edits, owner/admin delete, note/photo authorship).
- **Recipe shape** (`src/lib/types.ts`): `notes` and `photos` are jsonb arrays on the `recipes` row; `created` is exposed as `{seconds, nanoseconds}` for the UI. Favorites are rows in `favorites` (not an array on the user).
- **Client calls**: use `api()` from `src/lib/api.ts` for JSON routes.

### Image Fetching Strategy (Critical Pattern)

**Multi-layer caching** to minimize API calls (see [src/utils/unsplash.tsx](src/utils/unsplash.tsx)):

1. User-uploaded photos (`photos[0].url`) - highest priority
2. Cached URL in the database (`unsplashImageUrl`) - no API call
3. LocalStorage cache (30-day TTL) - client-side
4. Fresh Unsplash API call - last resort
5. Fallback image (`DEFAULT_RECIPE_IMAGE`, served from `public/images/static`)

**Implementation**: All image displays use `getOrFetchRecipeImage()` in useEffect, never direct URLs.

### Search Architecture

- **Algolia InstantSearch**: Search page uses `react-instantsearch` with client from `src/utils/algolia.tsx`
- **Hit component pattern**: Each search result fetches its own image via `getOrFetchRecipeImage()`
- **URL generation**: Recipe titles → URL slugs via `.replace(/\s/gi, "_")`, displayed lowercase but stored as-is

## Development Workflows

### Running the App

```bash
npm run dev          # Uses --turbopack for faster builds
npm run build        # Production build
npm run start        # Production server
```

### Environment Variables Required

Copy `.env.example` to `.env.local` and fill it in. Required: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_ALGOLIA_APPID`, `NEXT_PUBLIC_ALGOLIA_APIKEY`. Optional: Google OAuth (`GOOGLE_CLIENT_ID/SECRET`, `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`), `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY`, and `NEXT_PUBLIC_UNDER_CONSTRUCTION=true` (maintenance mode via `proxy.ts`).

### Authentication Flow

- **Better Auth** (`src/lib/auth.ts`, mounted at `/api/auth/[...all]`); client in `src/lib/auth-client.ts`
- **Login redirect**: Stores `returnUrl` in localStorage before navigating to `/login`, restored after sign-in
- **OAuth**: Google sign-in via `src/components/OAuth.jsx` (hidden unless `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true`)
- **Auth state**: `authClient.useSession()` / `useCurrentUser()`; on the server use `getCurrentUser()`. Admin = `user.isAdmin`
- **Password reset**: `/forgot_password` emails a link that lands on `/reset_password`

## Key Patterns & Conventions

### Styling

- **Tailwind 4**: Using new `@tailwindcss/postcss` plugin syntax
- **Fonts**: Poppins (body - layout.tsx), Josefin Sans (headers - page.tsx)
- **Background**: Fixed gradient overlay on body via `bg-[linear-gradient(...),url('/images/bg.jpg')]`
- **Colors**: Primary action color is `teal-600`, text is `gray-700`

### State Management

- No global state library - uses React hooks; auth state comes from `authClient.useSession()`
- **Custom hooks return objects** with all needed state/handlers (see `useRecipeActions` for pattern)
- **Optimistic UI**: Local state arrays (`localNotes`, `localPhotos`) update immediately, the API call syncs async

### Error Handling

- Display errors inline via state (e.g., `photoError`, `error` in hooks)
- No toast notifications or global error boundary
- Fallback values everywhere (e.g., `title || "Untitled Recipe"`)

### Critical Gotchas

- **Recipe slug matching**: Server-side looks the recipe up by exact `title`, so title casing must match exactly
- **Next.js Image**: Only Vercel Blob (and legacy Firebase Storage) hosts are whitelisted in `next.config.ts` - Unsplash URLs use regular `<img>`
- **Mixed file extensions**: Don't convert `.jsx` auth files to `.tsx` without updating OAuth imports
- **Notes format migration**: Always check if `notes` is string or array in components

## Integration Points

- **Unsplash**: See [UNSPLASH_SETUP.md](UNSPLASH_SETUP.md) for query building logic (tags → title keywords → full title)
- **Algolia**: Index must have `title`, `tags`, `createdBy`, `objectID` fields; no admin SDK (manual sync required)
- **Photo storage**: `POST /api/recipes/[id]/photos` re-encodes to WebP (1600px max) and stores via `src/lib/storage.ts` (Vercel Blob, or `public/uploads` in dev); the URL is stored in the recipe's `photos` array
- **Vercel**: Deployment config in `vercel.json` (IAD1 region)
