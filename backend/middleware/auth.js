const jwt = require("jsonwebtoken")
const User = require("../models/User")
const { AppError } = require("../utils/appError")

const auth = async (req, res, next) => {
  try {
    let token

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]
    }

    if (!token) {
      return next(new AppError("Access denied. No token provided.", 401))
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Get user from token
    const user = await User.findById(decoded.id).select("+password")

    if (!user || !user.isActive) {
      return next(new AppError("Invalid token or user inactive.", 401))
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token.", 401))
    } else if (error.name === "TokenExpiredError") {
      return next(new AppError("Token expired.", 401))
    }
    next(error)
  }
}

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("Access denied. Insufficient permissions.", 403))
    }
    next()
  }
}

module.exports = { auth, authorize }
