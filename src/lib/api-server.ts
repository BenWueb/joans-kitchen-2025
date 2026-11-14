import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "./session";

export const apiError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

export const UNAUTHORIZED = () =>
  apiError("You must be logged in to do that", 401);

export const FORBIDDEN = () =>
  apiError("You don't have permission to perform this action", 403);

export const NOT_FOUND = () => apiError("The requested item was not found", 404);

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Parse a JSON request body, returning null when it is missing or invalid. */
export async function readJson<T = any>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export const isAdminOrOwner = (
  user: CurrentUser,
  ownerId: string | null | undefined
) => user.isAdmin === true || (!!ownerId && ownerId === user.id);

/** Postgres unique_violation (also when wrapped by Drizzle's query error). */
export function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

export const DUPLICATE_TITLE = () =>
  apiError("A recipe with that title already exists", 409);
