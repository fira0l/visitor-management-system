const User = require("../models/User")
const { generateToken } = require("../utils/generateToken")
const { AppError } = require("../utils/appError")

const register = async (req, res, next) => {
  try {
    const { username, email, password, role, department, fullName } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return next(new AppError("User with this email or username already exists", 400))
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      role,
      department,
      fullName,
      createdBy: req.user ? req.user._id : null,
    })

    // Generate JWT token
    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      message: "User created successfully",
      token,
      user,
    })
  } catch (error) {
    next(error)
  }
}

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body

    // Find user and include password
    const user = await User.findOne({ username }).select("+password")

    if (!user || !user.isActive) {
      return next(new AppError("Invalid credentials or account inactive", 401))
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return next(new AppError("Invalid credentials", 401))
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save({ validateBeforeSave: false })

    // Generate JWT token
    const token = generateToken(user._id)

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
        fullName: user.fullName,
        lastLogin: user.lastLogin,
      },
    })
  } catch (error) {
    next(error)
  }
}

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)

    res.json({
      success: true,
      user,
    })
  } catch (error) {
    next(error)
  }
}

const logout = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Logout successful",
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  register,
  login,
  getCurrentUser,
  logout,
}
