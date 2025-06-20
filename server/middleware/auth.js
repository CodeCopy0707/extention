const jwt = require("jsonwebtoken")
const { promisify } = require("util")

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h"

const signToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id)

  const cookieOptions = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  }

  res.cookie("jwt", token, cookieOptions)

  // Remove password from output
  user.password = undefined

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  })
}

const protect = async (req, res, next) => {
  try {
    // 1) Getting token and check if it's there
    let token
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt
    }

    if (!token) {
      return res.status(401).json({
        error: "You are not logged in! Please log in to get access.",
      })
    }

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, JWT_SECRET)

    // 3) Check if user still exists (in a real app, you'd check database)
    const currentUser = {
      id: decoded.id,
      username: "sunny", // In production, fetch from database
    }

    if (!currentUser) {
      return res.status(401).json({
        error: "The user belonging to this token does no longer exist.",
      })
    }

    // 4) Grant access to protected route
    req.user = currentUser
    next()
  } catch (error) {
    return res.status(401).json({
      error: "Invalid token. Please log in again!",
    })
  }
}

module.exports = {
  signToken,
  createSendToken,
  protect,
}
