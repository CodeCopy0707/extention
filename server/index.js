const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const mongoSanitize = require("express-mongo-sanitize")
const xss = require("xss")
const hpp = require("hpp")
const compression = require("compression")
const cookieParser = require("cookie-parser")
const path = require("path")
const fs = require("fs")
require("dotenv").config()

const authRoutes = require("./routes/auth")
const fileRoutes = require("./routes/files")
const noteRoutes = require("./routes/notes")
const { errorHandler } = require("./middleware/errorHandler")
const { createDirectories } = require("./utils/fileSystem")

const app = express()
const PORT = process.env.PORT || 5000

// Create necessary directories
createDirectories()

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  message: {
    error: "Too many login attempts, please try again later.",
  },
})

app.use("/api/auth", authLimiter)
app.use("/api", limiter)

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200,
  }),
)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))
app.use(cookieParser())

// Data sanitization against NoSQL query injection
app.use(mongoSanitize())

// Data sanitization against XSS
app.use((req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = xss(req.body[key])
      }
    })
  }
  next()
})

// Prevent parameter pollution
app.use(hpp())

// Compression middleware
app.use(compression())

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/files", fileRoutes)
app.use("/api/notes", noteRoutes)

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")))

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build", "index.html"))
  })
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Error handling middleware
app.use(errorHandler)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`🔒 Security features enabled`)
  console.log(`📁 File storage ready`)
})

module.exports = app
