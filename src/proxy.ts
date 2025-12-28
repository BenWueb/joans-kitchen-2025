import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Check if under construction mode is enabled
  const underConstruction =
    process.env.NEXT_PUBLIC_UNDER_CONSTRUCTION === "true";

  // If not in construction mode, allow all requests
  if (!underConstruction) {
    return NextResponse.next();
  }

  // Allow access to the under-construction page itself
  if (request.nextUrl.pathname === "/under-construction") {
    return NextResponse.next();
  }

  // Allow access to static files and Next.js internals
  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.startsWith("/images") ||
    request.nextUrl.pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Redirect all other pages to under-construction
  return NextResponse.redirect(new URL("/under-construction", request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
