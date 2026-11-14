"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { DEFAULT_USER_NAME } from "@/lib/constants";
import { getUserFriendlyErrorMessage, logError } from "@/lib/errors";
import type { Note } from "@/lib/types";

interface UseRecipeNotesProps {
  recipeId: string;
  notes: any;
  notesUpdatedBy: string;
  notesUpdatedAt: string;
}

/**
 * Normalize notes to array format (handles legacy string format)
 */
function normalizeNotes(
  notes: any,
  notesUpdatedBy?: string,
  notesUpdatedAt?: string
): Note[] {
  if (Array.isArray(notes)) {
    return notes;
  }
  if (notes) {
    return [
      {
        text: notes,
        addedBy: notesUpdatedBy || DEFAULT_USER_NAME,
        addedAt: notesUpdatedAt || new Date().toISOString(),
      },
    ];
  }
  return [];
}

export function useRecipeNotes({
  recipeId,
  notes,
  notesUpdatedBy,
  notesUpdatedAt,
}: UseRecipeNotesProps) {
  const router = useRouter();
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [editedNoteText, setEditedNoteText] = useState("");
  const [localNotes, setLocalNotes] = useState<Note[]>(
    normalizeNotes(notes, notesUpdatedBy, notesUpdatedAt)
  );

  // Update localNotes when notes prop changes
  useEffect(() => {
    const updatedNotes = normalizeNotes(notes, notesUpdatedBy, notesUpdatedAt);
    setLocalNotes(updatedNotes);
  }, [notes, notesUpdatedBy, notesUpdatedAt]);

  // Save notes to database
  const handleSaveNotes = async () => {
    if (!newNote.trim()) {
      setError("Please enter a note");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { notes: updatedNotes } = await api<{ notes: Note[] }>(
        `/api/recipes/${recipeId}/notes`,
        { method: "POST", json: { text: newNote } }
      );

      // Update local state immediately
      setLocalNotes(updatedNotes);
      setIsEditingNotes(false);
      setNewNote("");
      router.refresh();
      setSaving(false);
    } catch (error) {
      logError("useRecipeNotes - save note", error);
      setError(getUserFriendlyErrorMessage(error));
      setSaving(false);
    }
  };

  // Edit existing note
  const handleEditNote = async (index: number) => {
    if (!editedNoteText.trim()) {
      setError("Please enter a note");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { notes: updatedNotes } = await api<{ notes: Note[] }>(
        `/api/recipes/${recipeId}/notes`,
        { method: "PATCH", json: { index, text: editedNoteText } }
      );

      // Update local state immediately
      setLocalNotes(updatedNotes);
      setEditingNoteIndex(null);
      setEditedNoteText("");
      router.refresh();
      setSaving(false);
    } catch (error) {
      logError("useRecipeNotes - edit note", error);
      setError(getUserFriendlyErrorMessage(error));
      setSaving(false);
    }
  };

  // Delete note
  const handleDeleteNote = async (index: number) => {
    if (!confirm("Are you sure you want to delete this note?")) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { notes: updatedNotes } = await api<{ notes: Note[] }>(
        `/api/recipes/${recipeId}/notes`,
        { method: "DELETE", json: { index } }
      );

      // Update local state immediately
      setLocalNotes(updatedNotes);
      router.refresh();
      setSaving(false);
    } catch (error) {
      logError("useRecipeNotes - delete note", error);
      setError(getUserFriendlyErrorMessage(error));
      setSaving(false);
    }
  };

  return {
    isEditingNotes,
    newNote,
    saving,
    error,
    editingNoteIndex,
    editedNoteText,
    localNotes,
    setIsEditingNotes,
    setNewNote,
    setError,
    setEditingNoteIndex,
    setEditedNoteText,
    handleSaveNotes,
    handleEditNote,
    handleDeleteNote,
  };
}

