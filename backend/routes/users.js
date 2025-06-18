const express = require("express")
const User = require("../models/User")
const { auth, authorize } = require("../middleware/auth")
const { AppError } = require("../utils/appError")

const router = express.Router()

// All routes require authentication
router.use(auth)

// Get all users (admin only)
router.get("/", authorize("admin"), async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true }).select("-password").sort({ createdAt: -1 })

    res.json({
      success: true,
      users,
    })
  } catch (error) {
    next(error)
  }
})

// Update user status (admin only)
router.patch("/:id/status", authorize("admin"), async (req, res, next) => {
  try {
    const { isActive } = req.body

    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true, runValidators: true })

    if (!user) {
      return next(new AppError("User not found", 404))
    }

    res.json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user,
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
