const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      unique: true,
      // required: [true, "Employee ID is required"], // Remove required to avoid validation error
      default: function () {
        return 'EMP' + Math.random().toString(36).substring(2, 10).toUpperCase();
      },
      trim: true,
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "department_user", "security", "gate"],
        message: "Role must be admin, department_user, security, or gate",
      },
      default: "department_user",
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    departmentType: {
      type: String,
      enum: ['wing', 'director', 'division'],
      default: 'division',
      trim: true,
    },
    departmentRole: {
      type: String,
      enum: ['division_head', 'wing', 'director'],
      default: 'division_head',
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [50, "Full name cannot exceed 50 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    location: {
      type: String,
      enum: ['Wollo Sefer', 'Operation'],
      required: [true, 'Location is required'],
      trim: true,
    },
    // Delegation tracking
    delegatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    delegatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    delegationReason: {
      type: String,
      trim: true,
    },
    delegationStartDate: {
      type: Date,
    },
    delegationEndDate: {
      type: Date,
    },
    isDelegated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// Index for better query performance
userSchema.index({ username: 1 })
userSchema.index({ email: 1 })
userSchema.index({ role: 1 })
userSchema.index({ employeeId: 1 })

// Generate employee ID before saving
userSchema.pre("save", async function (next) {
  if (this.isNew && (!this.employeeId || this.employeeId === '')) {
    try {
      // Get the latest employee ID with proper numeric extraction
      const latestUser = await this.constructor.findOne(
        { employeeId: { $regex: /^EMP\d{6}$/ } },
        {},
        { sort: { employeeId: -1 } }
      );
      let nextId = 1;
      if (latestUser && latestUser.employeeId) {
        const numericPart = latestUser.employeeId.replace('EMP', '');
        const currentId = parseInt(numericPart, 10);
        if (!isNaN(currentId)) {
          nextId = currentId + 1;
        }
      }
      this.employeeId = `EMP${String(nextId).padStart(6, '0')}`;
    } catch (error) {
      console.error('[User pre-save] Error generating employeeId:', error);
      // Fallback: set a random employeeId with timestamp
      this.employeeId = 'EMP' + Date.now().toString().slice(-6);
    }
  }
  // Final fallback: if still missing, set a random employeeId
  if (!this.employeeId || this.employeeId === '' || this.employeeId.includes('NaN')) {
    this.employeeId = 'EMP' + Date.now().toString().slice(-6);
  }

  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(Number.parseInt(process.env.BCRYPT_ROUNDS) || 12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject()
  delete user.password
  return user
}

module.exports = mongoose.model("User", userSchema)
