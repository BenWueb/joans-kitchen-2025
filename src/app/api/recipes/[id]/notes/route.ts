import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import {
  apiError,
  FORBIDDEN,
  NOT_FOUND,
  readJson,
  UNAUTHORIZED,
} from "@/lib/api-server";
import { DEFAULT_USER_NAME } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import type { Note } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };
type Mutation = (notes: Note[]) => Note[] | Response;

// Notes live in a jsonb array, so each change is a read-modify-write inside a
// row-locked transaction to avoid losing concurrent edits.
async function mutateNotes(id: string, mutate: Mutation) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ notes: recipes.notes })
      .from(recipes)
      .where(eq(recipes.id, id))
      .for("update");
    if (!row) return NOT_FOUND();

    const result = mutate(Array.isArray(row.notes) ? row.notes : []);
    if (result instanceof Response) return result;

    await tx.update(recipes).set({ notes: result }).where(eq(recipes.id, id));
    return NextResponse.json({ notes: result });
  });
}

export async function POST(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED();

  const { id } = await params;
  const body = await readJson<{ text?: string }>(request);
  const text = body?.text?.trim();
  if (!text) return apiError("Please enter a note", 400);

  return mutateNotes(id, (notes) => [
    {
      text,
      addedBy: user.name || DEFAULT_USER_NAME,
      addedByUserId: user.id,
      addedAt: new Date().toISOString(),
    },
    ...notes,
  ]);
}

export async function PATCH(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED();

  const { id } = await params;
  const body = await readJson<{ index?: number; text?: string }>(request);
  const text = body?.text?.trim();
  if (!text) return apiError("Please enter a note", 400);
  const index = body?.index;

  return mutateNotes(id, (notes) => {
    if (!Number.isInteger(index) || index! < 0 || index! >= notes.length) {
      return NOT_FOUND();
    }
    const note = notes[index!];
    if (!user.isAdmin && note.addedByUserId !== user.id) return FORBIDDEN();

    const next = [...notes];
    next[index!] = { ...note, text, editedAt: new Date().toISOString() };
    return next;
  });
}

export async function DELETE(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED();

  const { id } = await params;
  const body = await readJson<{ index?: number }>(request);
  const index = body?.index;

  return mutateNotes(id, (notes) => {
    if (!Number.isInteger(index) || index! < 0 || index! >= notes.length) {
      return NOT_FOUND();
    }
    if (!user.isAdmin && notes[index!].addedByUserId !== user.id) {
      return FORBIDDEN();
    }
    return notes.filter((_, i) => i !== index);
  });
}
