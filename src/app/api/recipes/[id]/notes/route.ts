import { randomUUID } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { recipeNotes, recipes, user as users } from "@/db/schema";
import {
  apiError,
  FORBIDDEN,
  NOT_FOUND,
  readJson,
  UNAUTHORIZED,
} from "@/lib/api-server";
import { toNote } from "@/lib/recipes";
import { getCurrentUser } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

async function listNotes(recipeId: string) {
  const rows = await db
    .select({ note: recipeNotes, name: users.name })
    .from(recipeNotes)
    .leftJoin(users, eq(users.id, recipeNotes.userId))
    .where(eq(recipeNotes.recipeId, recipeId))
    .orderBy(desc(recipeNotes.createdAt));
  return NextResponse.json({ notes: rows.map((r) => toNote(r.note, r.name)) });
}

export async function POST(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED();

  const { id } = await params;
  const body = await readJson<{ text?: string }>(request);
  const text = body?.text?.trim();
  if (!text) return apiError("Please enter a note", 400);

  const [recipe] = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(eq(recipes.id, id))
    .limit(1);
  if (!recipe) return NOT_FOUND();

  await db.insert(recipeNotes).values({
    id: randomUUID(),
    recipeId: id,
    userId: user.id,
    authorName: user.name,
    text,
  });
  return listNotes(id);
}

// Edit/delete: only the note's author or an admin
async function findOwnedNote(
  user: { id: string; isAdmin?: boolean | null },
  recipeId: string,
  noteId: unknown
) {
  if (typeof noteId !== "string") return { error: NOT_FOUND() };
  const [note] = await db
    .select()
    .from(recipeNotes)
    .where(and(eq(recipeNotes.id, noteId), eq(recipeNotes.recipeId, recipeId)))
    .limit(1);
  if (!note) return { error: NOT_FOUND() };
  if (!user.isAdmin && note.userId !== user.id) return { error: FORBIDDEN() };
  return { note };
}

export async function PATCH(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED();

  const { id } = await params;
  const body = await readJson<{ id?: string; text?: string }>(request);
  const text = body?.text?.trim();
  if (!text) return apiError("Please enter a note", 400);

  const { note, error } = await findOwnedNote(user, id, body?.id);
  if (error) return error;

  await db
    .update(recipeNotes)
    .set({ text, editedAt: new Date() })
    .where(eq(recipeNotes.id, note.id));
  return listNotes(id);
}

export async function DELETE(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED();

  const { id } = await params;
  const body = await readJson<{ id?: string }>(request);

  const { note, error } = await findOwnedNote(user, id, body?.id);
  if (error) return error;

  await db.delete(recipeNotes).where(eq(recipeNotes.id, note.id));
  return listNotes(id);
}
