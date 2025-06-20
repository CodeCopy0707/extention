const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const session = require("express-session")
const bcrypt = require("bcrypt")
const { v4: uuidv4 } = require("uuid")

const app = express()
const PORT = process.env.PORT || 3000

// Create necessary directories
const uploadsDir = path.join(__dirname, "uploads")
const notesDir = path.join(__dirname, "notes")
const publicDir = path.join(__dirname, "public")
;[uploadsDir, notesDir, publicDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))

// Session configuration
app.use(
  session({
    secret: "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
)

// Admin credentials
const ADMIN_CREDENTIALS = {
  username: "sunny",
  password: "SANDEEP1717a",
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}-${file.originalname}`
    cb(null, uniqueName)
  },
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
})

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.authenticated) {
    next()
  } else {
    res.status(401).json({ error: "Authentication required" })
  }
}

// Routes

// Serve main page
app.get("/", (req, res) => {
  if (req.session && req.session.authenticated) {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"))
  } else {
    res.sendFile(path.join(__dirname, "public", "login.html"))
  }
})

// Login endpoint
app.post("/api/login", (req, res) => {
  const { username, password } = req.body

  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    req.session.authenticated = true
    req.session.username = username
    res.json({ success: true, message: "Login successful" })
  } else {
    res.status(401).json({ error: "Invalid credentials" })
  }
})

// Logout endpoint
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Logout failed" })
    } else {
      res.json({ success: true, message: "Logged out successfully" })
    }
  })
})

// Check authentication status
app.get("/api/auth-status", (req, res) => {
  res.json({
    authenticated: !!(req.session && req.session.authenticated),
    username: req.session?.username,
  })
})

// File upload endpoint
app.post("/api/upload", requireAuth, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" })
  }

  const fileInfo = {
    id: uuidv4(),
    originalName: req.file.originalname,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
    uploadDate: new Date().toISOString(),
    path: req.file.path,
  }

  res.json({
    success: true,
    message: "File uploaded successfully",
    file: fileInfo,
  })
})

// Get all files
app.get("/api/files", requireAuth, (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir).map((filename) => {
      const filePath = path.join(uploadsDir, filename)
      const stats = fs.statSync(filePath)

      return {
        filename: filename,
        originalName: filename.split("-").slice(2).join("-"), // Remove timestamp and UUID
        size: stats.size,
        uploadDate: stats.birthtime.toISOString(),
        path: filePath,
      }
    })

    res.json(files)
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve files" })
  }
})

// Download file
app.get("/api/download/:filename", requireAuth, (req, res) => {
  const filename = req.params.filename
  const filePath = path.join(uploadsDir, filename)

  if (fs.existsSync(filePath)) {
    res.download(filePath)
  } else {
    res.status(404).json({ error: "File not found" })
  }
})

// Delete file
app.delete("/api/files/:filename", requireAuth, (req, res) => {
  const filename = req.params.filename
  const filePath = path.join(uploadsDir, filename)

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      res.json({ success: true, message: "File deleted successfully" })
    } else {
      res.status(404).json({ error: "File not found" })
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete file" })
  }
})

// Share file (generate shareable link)
app.post("/api/share/:filename", requireAuth, (req, res) => {
  const filename = req.params.filename
  const filePath = path.join(uploadsDir, filename)

  if (fs.existsSync(filePath)) {
    const shareId = uuidv4()
    const shareLink = `${req.protocol}://${req.get("host")}/shared/${shareId}`

    // Store share mapping (in production, use a database)
    if (!global.shareMap) global.shareMap = {}
    global.shareMap[shareId] = filename

    res.json({
      success: true,
      shareLink: shareLink,
      shareId: shareId,
    })
  } else {
    res.status(404).json({ error: "File not found" })
  }
})

// Access shared file
app.get("/shared/:shareId", (req, res) => {
  const shareId = req.params.shareId

  if (global.shareMap && global.shareMap[shareId]) {
    const filename = global.shareMap[shareId]
    const filePath = path.join(uploadsDir, filename)

    if (fs.existsSync(filePath)) {
      res.download(filePath)
    } else {
      res.status(404).send("Shared file not found")
    }
  } else {
    res.status(404).send("Invalid share link")
  }
})

// Notes API endpoints

// Get all notes
app.get("/api/notes", requireAuth, (req, res) => {
  try {
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
        }
      })

    res.json(notes)
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve notes" })
  }
})

// Create or update note
app.post("/api/notes", requireAuth, (req, res) => {
  const { title, content } = req.body

  if (!title || content === undefined) {
    return res.status(400).json({ error: "Title and content are required" })
  }

  try {
    const filename = `${title}.txt`
    const filePath = path.join(notesDir, filename)

    fs.writeFileSync(filePath, content, "utf8")

    res.json({
      success: true,
      message: "Note saved successfully",
      note: {
        id: title,
        title: title,
        content: content,
        lastModified: new Date().toISOString(),
      },
    })
  } catch (error) {
    res.status(500).json({ error: "Failed to save note" })
  }
})

// Get specific note
app.get("/api/notes/:id", requireAuth, (req, res) => {
  const noteId = req.params.id
  const filePath = path.join(notesDir, `${noteId}.txt`)

  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf8")
      const stats = fs.statSync(filePath)

      res.json({
        id: noteId,
        title: noteId,
        content: content,
        lastModified: stats.mtime.toISOString(),
      })
    } else {
      res.status(404).json({ error: "Note not found" })
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve note" })
  }
})

// Delete note
app.delete("/api/notes/:id", requireAuth, (req, res) => {
  const noteId = req.params.id
  const filePath = path.join(notesDir, `${noteId}.txt`)

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      res.json({ success: true, message: "Note deleted successfully" })
    } else {
      res.status(404).json({ error: "Note not found" })
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete note" })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`File Management Server running on port ${PORT}`)
  console.log(`Access the application at: http://localhost:${PORT}`)
  console.log(`Admin credentials - Username: ${ADMIN_CREDENTIALS.username}, Password: ${ADMIN_CREDENTIALS.password}`)
})

module.exports = app
