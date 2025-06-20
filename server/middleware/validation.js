const { body, validationResult } = require("express-validator")

const validateLogin = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be between 3 and 20 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
]

const validateNote = [
  body("title").trim().isLength({ min: 1, max: 100 }).withMessage("Title must be between 1 and 100 characters"),

  body("content").isLength({ max: 10000 }).withMessage("Content must not exceed 10000 characters"),
]

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    })
  }
  next()
}

module.exports = {
  validateLogin,
  validateNote,
  handleValidationErrors,
}
