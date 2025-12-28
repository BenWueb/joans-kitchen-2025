# Unsplash API Integration Setup

## Overview

This app uses Unsplash API to automatically fetch relevant food images for recipes that don't have user-uploaded photos.

## Features

- **Smart Image Fetching**: Automatically gets relevant images based on recipe title and tags
- **Multi-Layer Caching**:
  1. User-uploaded images (priority)
  2. Firestore cached Unsplash URLs
  3. LocalStorage cache (30-day expiry)
  4. Fresh Unsplash API call (as last resort)
- **Fallback Strategy**: Uses default image if all else fails
- **Rate Limit Friendly**: Caches aggressively to stay within free tier (50 requests/hour)

## Setup Instructions

### 1. Get Unsplash API Access

1. Go to https://unsplash.com/developers
2. Sign up or log in
3. Click "New Application"
4. Accept terms and create app
5. Copy your **Access Key**

### 2. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`
2. Add your Unsplash Access Key:

```bash
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_access_key_here
```

### 3. Test the Integration

1. Navigate to any recipe page
2. The hero image should load from Unsplash (if no imageUrls exist)
3. Check Firestore - the recipe document should now have `unsplashImageUrl` field
4. Subsequent visits will use the cached URL (no API calls)

## How It Works

### Recipe Page (SingleRecipe.jsx)

```javascript
// Fetches image on component mount
useEffect(() => {
  const loadImage = async () => {
    const url = await getOrFetchRecipeImage(recipeId, {
      id: recipeId,
      title,
      tags,
      imageUrls,
    });
    setRecipeImage(url);
  };
  loadImage();
}, [recipeId]);
```

### Search Results (page.tsx)

```javascript
// Each card fetches its own image
useEffect(() => {
  const loadImage = async () => {
    if (!hit.imageUrls?.[0] && !hit.unsplashImageUrl) {
      const url = await getOrFetchRecipeImage(hit.objectID, hit);
      setImageUrl(url);
    }
  };
  loadImage();
}, [hit]);
```

### Image Priority

1. **User-uploaded images** (`imageUrls[0]`) - Always used first
2. **Cached Unsplash URL** (`unsplashImageUrl` in Firestore) - No API call needed
3. **LocalStorage cache** - Fast client-side cache
4. **Fresh Unsplash fetch** - Only when needed
5. **Fallback image** - If everything fails

## Query Building Logic

The `buildImageQuery()` function creates smart search queries:

```javascript
// Priority 1: Recipe tags
tags: ["dessert"] → "dessert food"

// Priority 2: Keywords in title
title: "Grilled Chicken Salad" → "chicken dish food"

// Priority 3: Full title
title: "Mom's Special Recipe" → "Mom's Special Recipe food"
```

## Firestore Schema Updates

Recipes now store Unsplash metadata:

```javascript
{
  title: "Chocolate Cake",
  imageUrls: [], // User uploads (priority)
  unsplashImageUrl: "https://images.unsplash.com/...", // Cached URL
  unsplashPhotographer: "John Doe",
  unsplashPhotographerUrl: "https://unsplash.com/@john"
}
```

## Rate Limiting

**Free Tier**: 50 requests/hour

**Mitigation Strategies**:

- ✅ Firestore caching (permanent)
- ✅ LocalStorage caching (30 days)
- ✅ Only fetch when no image exists
- ✅ Batch initial setup if needed

**Typical Usage**:

- First visit to 50 recipes: 50 API calls
- All subsequent visits: 0 API calls (cached)
- New recipe added: 1 API call, then cached

## Future Enhancements

### 1. Attribution Display (Optional)

Show photographer credit:

```jsx
{
  unsplashPhotographer && (
    <a href={unsplashPhotographerUrl} className="text-xs text-gray-500">
      Photo by {unsplashPhotographer} on Unsplash
    </a>
  );
}
```

### 2. Bulk Image Fetching

For initial setup of many recipes:

```bash
npm run fetch-all-images
```

### 3. Admin Panel

- View images before they're cached
- Replace unsatisfactory images
- Clear cache for specific recipes

## Troubleshooting

### Images Not Loading

1. Check `.env.local` has correct Access Key
2. Check browser console for API errors
3. Verify Firestore rules allow writes to `recipes` collection
4. Check rate limit (50/hour) not exceeded

### Wrong Images

The algorithm tries to match based on title/tags. To improve:

1. Add specific tags to recipes (e.g., "chicken", "dessert", "pasta")
2. Use descriptive recipe titles
3. Upload custom images via `imageUrls` field

### Performance

- First load: ~500ms (API call + Firestore write)
- Cached loads: ~50ms (read from Firestore)
- LocalStorage hits: instant

## Cost Analysis

**Free Forever**:

- 50 requests/hour = 1,200/day = 36,000/month
- Perfect for personal/small sites
- Typically use <100 requests total (one-time setup)

**If You Need More**:

- Paid plans start at $10/month for 5,000 requests/hour
- Unlikely to need this for a recipe site
