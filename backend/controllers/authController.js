const User = require("../models/User")
const { generateToken } = require("../utils/generateToken")
const { AppError } = require("../utils/appError")

const register = async (req, res, next) => {
  try {
    const { username, email, password, role, department, fullName, location, departmentType } = req.body

    if (!location || !['Wollo Sefer', 'Operation'].includes(location)) {
      return next(new AppError('Location is required and must be either Wollo Sefer or Operation', 400));
    }

    if (role === 'department_user' && (!departmentType || !['wing', 'director', 'division'].includes(departmentType))) {
      return next(new AppError('Department type is required for department users and must be either wing, director, or division', 400));
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return next(new AppError("User with this email or username already exists", 400))
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

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      role,
      department,
      fullName,
      location,
      departmentType,
      departmentRole: role === 'department_user' ? 'division_head' : undefined,
      createdBy: req.user ? req.user._id : null,
      isApproved: false, // All new users must be approved by security
      employeeId, // fallback
    })

    // Do not generate token if not approved
    res.status(201).json({
      success: true,
      message: "User created successfully. Your account is pending approval by security.",
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
    if (!user.isApproved) {
      return next(new AppError("Your account is pending approval by security.", 403))
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
