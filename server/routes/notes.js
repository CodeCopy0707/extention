const express = require("express")
const fs = require("fs")
const path = require("path")
const { protect } = require("../middleware/auth")
const { validateNote, handleValidationErrors } = require("../middleware/validation")

const router = express.Router()

// Protect all routes
router.use(protect)

const notesDir = path.join(__dirname, "../notes")

// Get all notes
router.get("/", (req, res, next) => {
  try {
    if (!fs.existsSync(notesDir)) {
      return res.status(200).json({
        status: "success",
        data: {
          notes: [],
        },
      })
    }

    const notes = fs
      .readdirSync(notesDir)
      .filter((file) => file.endsWith(".txt"))
      .map((filename) => {
        const filePath = path.join(notesDir, filename)
        const stats = fs.statSync(filePath)
        const content = fs.readFileSync(filePath, "utf8")

        return {
          id: filename.replace(".txt", ""),
          title: filename.replace(".txt", ""),
          content: content,
          lastModified: stats.mtime.toISOString(),
          size: stats.size,
        }
      })
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))

    res.status(200).json({
      status: "success",
      results: notes.length,
      data: {
        notes,
      },
    })
  } catch (error) {
    next(error)
  }
})

// Get specific note
router.get("/:id", (req, res, next) => {
  try {
    const noteId = req.params.id

    // Security: validate note ID
    if (!/^[a-zA-Z0-9_\-\s]+$/.test(noteId)) {
      return res.status(400).json({
        error: "Invalid note ID",
      })
    }

    const filePath = path.join(notesDir, `${noteId}.txt`)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: "Note not found",
      })
    }

    const content = fs.readFileSync(filePath, "utf8")
    const stats = fs.statSync(filePath)

    res.status(200).json({
      status: "success",
      data: {
        note: {
          id: noteId,
          title: noteId,
          content: content,
          lastModified: stats.mtime.toISOString(),
          size: stats.size,
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// Create or update note
router.post("/", validateNote, handleValidationErrors, (req, res, next) => {
  try {
    const { title, content } = req.body

    // Security: sanitize title for filename
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9_\-\s]/g, "").trim()

    if (!sanitizedTitle) {
      return res.status(400).json({
        error: "Invalid title",
      })
    }

    const filename = `${sanitizedTitle}.txt`
    const filePath = path.join(notesDir, filename)

    fs.writeFileSync(filePath, content, "utf8")

    const stats = fs.statSync(filePath)

    res.status(200).json({
      status: "success",
      message: "Note saved successfully",
      data: {
        note: {
          id: sanitizedTitle,
          title: sanitizedTitle,
          content: content,
          lastModified: stats.mtime.toISOString(),
          size: stats.size,
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// Delete note
router.delete("/:id", (req, res, next) => {
  try {
    const noteId = req.params.id

    // Security: validate note ID
    if (!/^[a-zA-Z0-9_\-\s]+$/.test(noteId)) {
      return res.status(400).json({
        error: "Invalid note ID",
      })
    }

    const filePath = path.join(notesDir, `${noteId}.txt`)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: "Note not found",
      })
    }

    fs.unlinkSync(filePath)

    res.status(200).json({
      status: "success",
      message: "Note deleted successfully",
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
