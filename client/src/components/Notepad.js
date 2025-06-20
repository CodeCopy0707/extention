"use client"

import { useState, useEffect } from "react"
import { Plus, Save, Trash2, FileText, Edit3 } from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"

export default function Notepad() {
  const [notes, setNotes] = useState([])
  const [currentNote, setCurrentNote] = useState(null)
  const [noteTitle, setNoteTitle] = useState("")
  const [noteContent, setNoteContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    try {
      const response = await axios.get("/notes")
      setNotes(response.data.data.notes)
    } catch (error) {
      toast.error("Failed to load notes")
    } finally {
      setLoading(false)
    }
  }

  const createNewNote = () => {
    setCurrentNote(null)
    setNoteTitle("")
    setNoteContent("")
  }

  const selectNote = async (noteId) => {
    try {
      const response = await axios.get(`/notes/${noteId}`)
      const note = response.data.data.note

      setCurrentNote(note)
      setNoteTitle(note.title)
      setNoteContent(note.content)
    } catch (error) {
      toast.error("Failed to load note")
    }
  }

  const saveNote = async () => {
    if (!noteTitle.trim()) {
      toast.error("Please enter a note title")
      return
    }

    setSaving(true)
    try {
      const response = await axios.post("/notes", {
        title: noteTitle.trim(),
        content: noteContent,
      })

      const savedNote = response.data.data.note
      setCurrentNote(savedNote)

      toast.success("Note saved successfully!")
      loadNotes()
    } catch (error) {
      const message = error.response?.data?.error || "Failed to save note"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const deleteNote = async () => {
    if (!currentNote) return

    if (!window.confirm("Are you sure you want to delete this note?")) return

    try {
      await axios.delete(`/notes/${currentNote.id}`)

      setCurrentNote(null)
      setNoteTitle("")
      setNoteContent("")

      toast.success("Note deleted successfully")
      loadNotes()
    } catch (error) {
      toast.error("Failed to delete note")
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Notes List */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Notes</h3>
            <button
              onClick={createNewNote}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-1" />
              New
            </button>
          </div>

          <div className="space-y-2">
            {notes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">No notes yet</p>
                <p className="text-xs text-gray-500">Create your first note</p>
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => selectNote(note.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    currentNote?.id === note.id
                      ? "bg-blue-100 border-blue-200"
                      : "bg-gray-50 hover:bg-gray-100 border-gray-200"
                  } border`}
                >
                  <div className="flex items-start space-x-2">
                    <FileText className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{note.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">{formatFileSize(note.size)}</p>
                        <p className="text-xs text-gray-400">{new Date(note.lastModified).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Note Editor */}
        <div className="lg:col-span-3">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Edit3 className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-medium text-gray-900">{currentNote ? "Edit Note" : "New Note"}</h3>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={saveNote}
                  disabled={saving || !noteTitle.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Note"}
                </button>

                {currentNote && (
                  <button
                    onClick={deleteNote}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="noteTitle" className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                id="noteTitle"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Enter note title..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="noteContent" className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                id="noteContent"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Start writing your note..."
                rows={20}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
              />
            </div>

            {currentNote && (
              <div className="text-sm text-gray-500">
                Last modified: {new Date(currentNote.lastModified).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
