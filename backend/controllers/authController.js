const User = require("../models/User")
const { generateToken } = require("../utils/generateToken")
const { AppError } = require("../utils/appError")
const { sendEmail } = require("../utils/emailService")

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

    // Send welcome email (best-effort)
    try {
      const subject = "Welcome to Visitor Management System!";
      const textBody = `Hello ${user.fullName},\n\nWelcome to the Visitor Management System! Your account has been successfully created.\nYour username is: ${user.username}\n\nPlease log in to start using the system.\n\nThank you,\nThe Admin Team`;
      const htmlBody = `
        <p>Hello ${user.fullName},</p>
        <p>Welcome to the Visitor Management System! Your account has been successfully created.</p>
        <p>Your username is: <strong>${user.username}</strong></p>
        <p>Please log in to start using the system.</p>
        <p>Thank you,<br>The Admin Team</p>
      `;
      await sendEmail(user.email, subject, htmlBody, textBody);
      console.log(`Registration email sent to ${user.email}`);
    } catch (emailError) {
      console.error(`Failed to send registration email to ${user.email}:`, emailError);
      // Do not block registration if email fails
    }

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
