const mongoose = require("mongoose")

const bulkUploadPermissionSchema = new mongoose.Schema(
  {
    departmentType: {
      type: String,
      enum: ['wing', 'director', 'division'],
      required: [true, 'Department type is required'],
      trim: true,
    },
    canUpload: {
      type: Boolean,
      default: false,
    },
    allowedTimeWindows: [
      {
        startTime: {
          type: String,
          required: true,
          match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format'],
        },
        endTime: {
          type: String,
          required: true,
          match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format'],
        },
        daysOfWeek: {
          type: [String],
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        },
      },
    ],
    maxFileSize: {
      type: Number, // in MB
      default: 10,
    },
    allowedFileTypes: {
      type: [String],
      default: ['application/pdf'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
bulkUploadPermissionSchema.index({ departmentType: 1 })
bulkUploadPermissionSchema.index({ isActive: 1 })

module.exports = mongoose.model("BulkUploadPermission", bulkUploadPermissionSchema) 