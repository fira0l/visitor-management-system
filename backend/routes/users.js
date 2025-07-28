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

// Create user (admin only)
router.post("/", authorize("admin"), async (req, res, next) => {
  try {
    const { username, email, password, role, department, departmentType, location, fullName } = req.body;
    if (!username || !email || !password || !role || !fullName || !location) {
      return next(new AppError("Missing required fields", 400));
    }
    // Prevent duplicate
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return next(new AppError("User with this email or username already exists", 400));
    }
    // Generate employeeId if missing (fallback for pre-save hook issues)
    let employeeId;
    const latestUser = await User.findOne({}, {}, { sort: { 'employeeId': -1 } });
    let nextId = 1;
    if (latestUser && latestUser.employeeId) {
      const currentId = parseInt(latestUser.employeeId.replace('EMP', ''));
      nextId = currentId + 1;
    }
    employeeId = `EMP${String(nextId).padStart(6, '0')}`;
    const user = await User.create({ username, email, password, role, department, departmentType, location, fullName, createdBy: req.user._id, employeeId });
    res.status(201).json({ success: true, message: "User created successfully", user });
  } catch (error) {
    next(error);
  }
});

// Update user (admin only)
router.patch("/:id", authorize("admin"), async (req, res, next) => {
  try {
    const { username, email, role, department, departmentType, location, fullName, isActive, departmentRole } = req.body;
    const updateData = { username, email, role, department, departmentType, location, fullName, isActive, departmentRole };
    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!user) {
      return next(new AppError("User not found", 404));
    }
    res.json({ success: true, message: "User updated successfully", user });
  } catch (error) {
    next(error);
  }
});

// Delete user (admin only)
router.delete("/:id", authorize("admin"), async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return next(new AppError("User not found", 404));
    }
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// Approve user (security only)
router.patch("/:id/approve", authorize("security"), async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true, runValidators: true }
    );
    if (!user) {
      return next(new AppError("User not found", 404));
    }
    res.json({
      success: true,
      message: "User approved successfully.",
      user,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router
