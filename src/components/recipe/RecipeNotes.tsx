"use client";

import { MdAdd, MdEdit, MdDelete } from "react-icons/md";
import { getAuth } from "firebase/auth";

interface Note {
  text: string;
  addedBy: string;
  addedByUserId?: string;
  addedAt: string;
  editedAt?: string;
}

interface RecipeNotesProps {
  notes: Note[];
  isEditingNotes: boolean;
  newNote: string;
  editingNoteIndex: number | null;
  editedNoteText: string;
  saving: boolean;
  error: string;
  currentUserId: string | null;
  onStartAddNote: () => void;
  onCancelAddNote: () => void;
  onNewNoteChange: (value: string) => void;
  onSaveNote: () => void;
  onStartEditNote: (index: number) => void;
  onCancelEditNote: () => void;
  onEditedNoteChange: (value: string) => void;
  onSaveEditNote: (index: number) => void;
  onDeleteNote: (index: number) => void;
}

export default function RecipeNotes({
  notes,
  isEditingNotes,
  newNote,
  editingNoteIndex,
  editedNoteText,
  saving,
  error,
  currentUserId,
  onStartAddNote,
  onCancelAddNote,
  onNewNoteChange,
  onSaveNote,
  onStartEditNote,
  onCancelEditNote,
  onEditedNoteChange,
  onSaveEditNote,
  onDeleteNote,
}: RecipeNotesProps) {
  return (
    <div className="bg-linear-to-br from-teal-100 via-cyan-50 to-teal-100 rounded-lg shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h5 className="text-lg font-bold text-gray-700">Notes</h5>
        {!isEditingNotes && getAuth().currentUser && (
          <button
            onClick={onStartAddNote}
            className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-md transition-colors"
          >
            <MdAdd className="w-4 h-4" />
            Add Note
          </button>
        )}
      </div>

      {isEditingNotes && (
        <div className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200">
          {error && (
            <div className="mb-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          <textarea
            value={newNote}
            onChange={(e) => onNewNoteChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-600 min-h-25"
            placeholder="Add your note here..."
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={onSaveNote}
              disabled={saving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={onCancelAddNote}
              disabled={saving}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {notes.length > 0 ? (
          notes.map((note, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 rounded-md border border-gray-200"
            >
              {editingNoteIndex === index ? (
                <div>
                  <textarea
                    value={editedNoteText}
                    onChange={(e) => onEditedNoteChange(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-600 min-h-25 mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSaveEditNote(index)}
                      disabled={saving}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={onCancelEditNote}
                      disabled={saving}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-md transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-gray-600 flex-1">{note.text}</p>
                    {currentUserId &&
                      note.addedByUserId === currentUserId &&
                      editingNoteIndex === null &&
                      !isEditingNotes && (
                        <div className="flex gap-2 ml-2">
                          <button
                            onClick={() => onStartEditNote(index)}
                            className="text-teal-600 hover:text-teal-700"
                            title="Edit note"
                          >
                            <MdEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteNote(index)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete note"
                          >
                            <MdDelete className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                  </div>
                  <div className="text-xs text-gray-500 italic">
                    {note.addedBy}
                    {note.addedBy.toLowerCase() !== "joan" && (
                      <>
                        {" "}
                        •{" "}
                        {new Date(note.addedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {note.editedAt && " (edited)"}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm italic">No notes yet</p>
        )}
      </div>
    </div>
  );
}

