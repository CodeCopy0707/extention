const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { v4: uuidv4 } = require("uuid")
const { protect } = require("../middleware/auth")

const router = express.Router()

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads")
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}-${file.originalname}`
    cb(null, uniqueName)
  },
})

// File filter for security
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar|mp3|mp4|avi/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb(new Error("File type not allowed"), false)
  }
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 5, // Maximum 5 files at once
  },
  fileFilter: fileFilter,
})

// Protect all routes
router.use(protect)

// Upload files
router.post("/upload", upload.array("files", 5), (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: "No files uploaded",
      })
    }

    const uploadedFiles = req.files.map((file) => ({
      id: uuidv4(),
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      uploadDate: new Date().toISOString(),
      path: file.path,
    }))

    res.status(200).json({
      status: "success",
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      data: {
        files: uploadedFiles,
      },
    })
  } catch (error) {
    next(error)
  }
})

// Get all files
router.get("/", (req, res, next) => {
  try {
    const uploadsDir = path.join(__dirname, "../uploads")

    if (!fs.existsSync(uploadsDir)) {
      return res.status(200).json({
        status: "success",
        data: {
          files: [],
        },
      })
    }

    const files = fs.readdirSync(uploadsDir).map((filename) => {
      const filePath = path.join(uploadsDir, filename)
      const stats = fs.statSync(filePath)

      return {
        filename: filename,
        originalName: filename.split("-").slice(2).join("-"),
        size: stats.size,
        uploadDate: stats.birthtime.toISOString(),
        path: filePath,
      }
    })

    res.status(200).json({
      status: "success",
      results: files.length,
      data: {
        files,
      },
    })
  } catch (error) {
    next(error)
  }
})

// Download file
router.get("/download/:filename", (req, res, next) => {
  try {
    const filename = req.params.filename
    const filePath = path.join(__dirname, "../uploads", filename)

    // Security check: ensure file is within uploads directory
    const resolvedPath = path.resolve(filePath)
    const uploadsPath = path.resolve(path.join(__dirname, "../uploads"))

    if (!resolvedPath.startsWith(uploadsPath)) {
      return res.status(403).json({
        error: "Access denied",
      })
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: "File not found",
      })
    }

    res.download(filePath)
  } catch (error) {
    next(error)
  }
})

// Delete file
router.delete("/:filename", (req, res, next) => {
  try {
    const filename = req.params.filename
    const filePath = path.join(__dirname, "../uploads", filename)

    // Security check
    const resolvedPath = path.resolve(filePath)
    const uploadsPath = path.resolve(path.join(__dirname, "../uploads"))

    if (!resolvedPath.startsWith(uploadsPath)) {
      return res.status(403).json({
        error: "Access denied",
      })
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: "File not found",
      })
    }

    fs.unlinkSync(filePath)

    res.status(200).json({
      status: "success",
      message: "File deleted successfully",
    })
  } catch (error) {
    next(error)
  }
})

// Share file
router.post("/share/:filename", (req, res, next) => {
  try {
    const filename = req.params.filename
    const filePath = path.join(__dirname, "../uploads", filename)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: "File not found",
      })
    }

    const shareId = uuidv4()
    const shareLink = `${req.protocol}://${req.get("host")}/api/files/shared/${shareId}`

    // Store share mapping (in production, use Redis or database)
    if (!global.shareMap) global.shareMap = {}
    global.shareMap[shareId] = {
      filename: filename,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    }

    res.status(200).json({
      status: "success",
      data: {
        shareLink: shareLink,
        shareId: shareId,
        expiresAt: global.shareMap[shareId].expiresAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// Access shared file
router.get("/shared/:shareId", (req, res, next) => {
  try {
    const shareId = req.params.shareId

    if (!global.shareMap || !global.shareMap[shareId]) {
      return res.status(404).json({
        error: "Invalid or expired share link",
      })
    }

    const shareData = global.shareMap[shareId]

    // Check if link has expired
    if (new Date() > shareData.expiresAt) {
      delete global.shareMap[shareId]
      return res.status(404).json({
        error: "Share link has expired",
      })
    }

    const filename = shareData.filename
    const filePath = path.join(__dirname, "../uploads", filename)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: "Shared file not found",
      })
    }

    res.download(filePath)
  } catch (error) {
    next(error)
  }
})

module.exports = router
