const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "user_created",
        "user_updated",
        "user_deleted",
        "delegation_requested",
        "delegation_approved",
        "delegation_rejected",
        "delegation_activated",
        "delegation_cancelled",
        "request_created",
        "request_approved",
        "request_rejected",
        "request_checked_in",
        "request_checked_out",
        // Add more as needed
      ],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    performedByEmployeeId: {
      type: String,
      required: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    targetUserEmployeeId: {
      type: String,
    },
    details: {
      type: Object,
      default: {},
    },
    context: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ action: 1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ targetUser: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema); 