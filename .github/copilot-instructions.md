# Joan's Kitchen - AI Coding Agent Instructions

## Project Overview

Next.js 16 recipe management app with Firebase backend, Algolia search, and Unsplash image integration. Uses App Router with mixed TypeScript (.tsx/.ts) and JavaScript (.jsx/.js) files.

## Architecture & Data Flow

### File Naming & Component Conventions

- **Mixed file extensions**: `.jsx` for auth/OAuth components, `.tsx` for everything else
- **Dynamic routes**: `[recipe]/page.tsx` converts underscored URLs to recipe titles (e.g., `Grilled_Chicken` → "grilled chicken")
- **Hook pattern**: Custom hooks in `src/hooks/` handle all Firebase operations and UI state (e.g., `useRecipeActions`, `usePhotoUpload`)
- **Component structure**: "Smart" components (with hooks) live in `src/components/`, pure layout components inline in pages

### Firebase Integration (`src/firestore.config.js`)

- Exports `db`, `auth`, `storage` as named exports (not default)
- All Firebase operations use modular v9+ SDK syntax (e.g., `doc(db, "recipes", id)`)
- **Collections**: `recipes` (main), `Users` (favorites stored in `favorites: string[]` array)
- **Recipe schema**:
  ```javascript
  {
    title, ingredients, recipe, tags[],
    imageUrls[], unsplashImageUrl, // Cached image URL
    notes: [{text, addedBy, addedAt}], // Array format (legacy string format auto-converted)
    photos: [{url, uploadedBy, uploadedAt}],
    createdBy
  }
  ```

### Image Fetching Strategy (Critical Pattern)

**Multi-layer caching** to minimize API calls (see [src/utils/unsplash.tsx](src/utils/unsplash.tsx)):

1. User-uploaded photos (`photos[0].url`) - highest priority
2. Firestore cached URL (`unsplashImageUrl`) - no API call
3. LocalStorage cache (30-day TTL) - client-side
4. Fresh Unsplash API call - last resort
5. Fallback image URL (hardcoded Firebase Storage)

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

Create `.env.local` with:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTHDOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECTID=...
NEXT_PUBLIC_FIREBASE_STORAGEBUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID=...
NEXT_PUBLIC_FIREBASE_APPID=...
NEXT_PUBLIC_ALGOLIA_APPID=...
NEXT_PUBLIC_ALGOLIA_APIKEY=...
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=...
NEXT_PUBLIC_UNDER_CONSTRUCTION=false  # Enables maintenance mode via proxy.ts
```

### Authentication Flow

- **Login redirect**: Stores `returnUrl` in localStorage before navigating to `/login`, restored after sign-in
- **OAuth**: Google sign-in via `src/components/OAuth.jsx`
- **Auth state**: Use `getAuth().currentUser` directly, no custom auth context

## Key Patterns & Conventions

### Styling

- **Tailwind 4**: Using new `@tailwindcss/postcss` plugin syntax
- **Fonts**: Poppins (body - layout.tsx), Josefin Sans (headers - page.tsx)
- **Background**: Fixed gradient overlay on body via `bg-[linear-gradient(...),url('/images/bg.jpg')]`
- **Colors**: Primary action color is `teal-600`, text is `gray-700`

### State Management

- No global state library - uses React hooks + Firebase real-time updates
- **Custom hooks return objects** with all needed state/handlers (see `useRecipeActions` for pattern)
- **Optimistic UI**: Local state arrays (`localNotes`, `localPhotos`) update immediately, Firebase syncs async

### Error Handling

- Display errors inline via state (e.g., `photoError`, `error` in hooks)
- No toast notifications or global error boundary
- Fallback values everywhere (e.g., `title || "Untitled Recipe"`)

### Critical Gotchas

- **Recipe slug matching**: Server-side uses `getDocs(query(...))` with title, but title casing must match exactly
- **Next.js Image**: Only Firebase Storage URLs whitelisted in `next.config.ts` - Unsplash URLs use regular `<img>`
- **Mixed file extensions**: Don't convert `.jsx` auth files to `.tsx` without updating OAuth imports
- **Notes format migration**: Always check if `notes` is string or array in components

## Integration Points

- **Unsplash**: See [UNSPLASH_SETUP.md](UNSPLASH_SETUP.md) for query building logic (tags → title keywords → full title)
- **Algolia**: Index must have `title`, `tags`, `createdBy`, `objectID` fields; no admin SDK (manual sync required)
- **Firebase Storage**: Photos uploaded to root bucket, URL returned and stored in `photos[]` array
- **Vercel**: Deployment config in `vercel.json` (IAD1 region)
