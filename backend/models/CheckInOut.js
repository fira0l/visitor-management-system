const mongoose = require("mongoose")

const checkInOutSchema = new mongoose.Schema(
  {
    visitorRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VisitorRequest",
      required: [true, "Visitor request is required"],
    },
    checkInTime: {
      type: Date,
      required: [true, "Check-in time is required"],
      default: Date.now,
    },
    checkOutTime: {
      type: Date,
      validate: {
        validator: function (checkOutTime) {
          return !checkOutTime || checkOutTime > this.checkInTime
        },
        message: "Check-out time must be after check-in time",
      },
    },
    checkInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Check-in by is required"],
    },
    checkOutBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    actualItemsBrought: [
      {
        type: String,
        trim: true,
        maxlength: [100, "Item description cannot exceed 100 characters"],
      },
    ],
    checkInNotes: {
      type: String,
      maxlength: [500, "Check-in notes cannot exceed 500 characters"],
    },
    checkOutNotes: {
      type: String,
      maxlength: [500, "Check-out notes cannot exceed 500 characters"],
    },
    duration: {
      type: Number, // in minutes
      min: [0, "Duration cannot be negative"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for better query performance
checkInOutSchema.index({ visitorRequest: 1 })
checkInOutSchema.index({ checkInTime: 1 })
checkInOutSchema.index({ checkOutTime: 1 })

// Calculate duration when checking out
checkInOutSchema.pre("save", function (next) {
  if (this.checkOutTime && this.checkInTime) {
    this.duration = Math.floor((this.checkOutTime - this.checkInTime) / (1000 * 60))
  }
  next()
})

module.exports = mongoose.model("CheckInOut", checkInOutSchema)
