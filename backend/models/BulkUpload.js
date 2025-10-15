const mongoose = require("mongoose")

const bulkUploadSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    filePath: {
      type: String,
      required: [true, 'File path is required'],
      trim: true,
    },
    fileSize: {
      type: Number, // in bytes
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, 'Uploaded by is required'],
    },
    location: {
      type: String,
      enum: ['Wollo Sefer', 'Operation'],
      required: [true, 'Location is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'completed', 'failed'],
      default: 'uploaded',
    },
    processingResult: {
      totalVisitors: {
        type: Number,
        default: 0,
      },
      successfulImports: {
        type: Number,
        default: 0,
      },
      failedImports: {
        type: Number,
        default: 0,
      },
      errors: [
        {
          row: Number,
          message: String,
          data: mongoose.Schema.Types.Mixed,
        },
      ],
    },
    extractedData: [
      {
        visitorName: String,
        visitorId: String,
        nationalId: String,
        visitorPhone: String,
        visitorEmail: String,
        purpose: String,
        department: String,
        scheduledDate: String,
        scheduledTime: String,
        companyName: String, // for group visits
        groupSize: Number, // for group visits
        originDepartment: String, // for individual visits
        rowNumber: Number,
        status: {
          type: String,
          enum: ['pending', 'imported', 'failed'],
          default: 'pending',
        },
        errorMessage: String,
      },
    ],
    processingStartedAt: {
      type: Date,
    },
    processingCompletedAt: {
      type: Date,
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
bulkUploadSchema.index({ uploadedBy: 1 })
bulkUploadSchema.index({ status: 1 })
bulkUploadSchema.index({ createdAt: 1 })

module.exports = mongoose.model("BulkUpload", bulkUploadSchema) 