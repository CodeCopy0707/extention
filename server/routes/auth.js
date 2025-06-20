const express = require("express")
const bcrypt = require("bcryptjs")
const { createSendToken, protect } = require("../middleware/auth")
const { validateLogin, handleValidationErrors } = require("../middleware/validation")

const router = express.Router()

// Admin credentials (in production, store in database with hashed password)
const ADMIN_USER = {
  id: "1",
  username: "sunny",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.Vp/PpO", // SANDEEP1717a hashed
}

// Login
router.post("/login", validateLogin, handleValidationErrors, async (req, res, next) => {
  try {
    const { username, password } = req.body

    // Check if user exists and password is correct
    if (username !== ADMIN_USER.username) {
      return res.status(401).json({
        error: "Invalid credentials",
      })
    }

    const isPasswordCorrect = await bcrypt.compare(password, ADMIN_USER.password)

    if (!isPasswordCorrect) {
      return res.status(401).json({
        error: "Invalid credentials",
      })
    }

    // If everything ok, send token to client
    createSendToken(ADMIN_USER, 200, res)
  } catch (error) {
    next(error)
  }
})

// Logout
router.post("/logout", (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  })

  res.status(200).json({ status: "success" })
})

// Get current user
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      user: req.user,
    },
  })
})

module.exports = router
