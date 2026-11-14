import "server-only";
import { headers } from "next/headers";
import { auth } from "./auth";

/** Returns the signed-in user for the current request, or null. */
export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}
