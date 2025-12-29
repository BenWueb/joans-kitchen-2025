/**
 * Converts a recipe title to a URL-safe format
 * Steps:
 * 1. Replace spaces with underscores
 * 2. Capitalize any letter that follows a non-letter character
 *
 * @param title - The recipe title
 * @returns URL-safe string (special characters like & are preserved)
 *
 * @example
 * recipeToUrl("Mac & Cheese") // "Mac_&_Cheese"
 * recipeToUrl("Beef Wellingtons / Mushroom-Spinach Filling") // "Beef_Wellingtons_/_Mushroom-Spinach_Filling"
 */
export function recipeToUrl(title: string): string {
  return title
    .replace(/\s/g, "_")
    .replace(/(^|[^a-zA-Z])([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
}

/**
 * Converts a URL-encoded recipe slug back to a title for database lookup
 * Steps:
 * 1. URL decode to convert %26 back to &, etc.
 * 2. Replace underscores with spaces
 * 3. Capitalize any letter that follows a non-letter character
 *
 * @param slug - The URL slug from the route parameter
 * @returns The recipe title formatted for database lookup
 *
 * @example
 * urlToRecipe("Mac_%26_Cheese") // "Mac & Cheese"
 * urlToRecipe("Beef_Wellingtons_%2F_Mushroom-Spinach_Filling") // "Beef Wellingtons / Mushroom-Spinach Filling"
 */
export function urlToRecipe(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/_/g, " ")
    .replace(/(^|[^a-zA-Z])([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
}
