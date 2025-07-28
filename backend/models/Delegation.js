const mongoose = require("mongoose")

const delegationSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Requesting user is required"],
    },
    requestedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Target user is required"],
    },
    reason: {
      type: String,
      required: [true, "Delegation reason is required"],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "active", "completed", "cancelled"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    permissions: {
      canCreateRequests: {
        type: Boolean,
        default: true,
      },
      canApproveRequests: {
        type: Boolean,
        default: false,
      },
      canBulkUpload: {
        type: Boolean,
        default: false,
      },
      gateAccess: {
        type: [String],
        enum: ["Gate 1", "Gate 2", "Gate 3"],
        default: [],
      },
      accessType: {
        type: [String],
        enum: ["VIP", "Guest"],
        default: ["Guest"],
      },
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

// Index for better query performance
delegationSchema.index({ requestedBy: 1 })
delegationSchema.index({ requestedTo: 1 })
delegationSchema.index({ status: 1 })
delegationSchema.index({ startDate: 1, endDate: 1 })

module.exports = mongoose.model("Delegation", delegationSchema) 