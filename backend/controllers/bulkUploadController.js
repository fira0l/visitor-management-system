const BulkUpload = require("../models/BulkUpload")
const BulkUploadPermission = require("../models/BulkUploadPermission")
const VisitorRequest = require("../models/VisitorRequest")
const { AppError } = require("../utils/appError")
const pdfParse = require("pdf-parse")
const fs = require("fs")

// Check if user has permission to upload at current time
const checkUploadPermission = async () => {
  // Simplified: All department users can upload
  return true
}

// Upload PDF file
const uploadPDF = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError("No file uploaded", 400))
    }

    // Check file type
    if (req.file.mimetype !== "application/pdf") {
      return next(new AppError("Only PDF files are allowed", 400))
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (req.file.size > maxSize) {
      return next(new AppError("File size too large. Maximum 10MB allowed", 400))
    }

    // Check upload permission
    await checkUploadPermission()

    // Create bulk upload record
    const bulkUpload = await BulkUpload.create({
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      uploadedBy: req.user._id,
      location: req.user.location,
    })

    await bulkUpload.populate("uploadedBy", "fullName username")

    res.status(201).json({
      success: true,
      message: "PDF uploaded successfully",
      bulkUpload,
    })
  } catch (error) {
    next(error)
  }
}

// Process uploaded PDF
const processPDF = async (req, res, next) => {
  try {
    const { id } = req.params

    const bulkUpload = await BulkUpload.findById(id)
    if (!bulkUpload) {
      return next(new AppError("Bulk upload not found", 404))
    }

    // Check if user owns this upload or is admin
    if (bulkUpload.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return next(new AppError("Not authorized to process this upload", 403))
    }

    if (bulkUpload.status !== "uploaded") {
      return next(new AppError("PDF already processed", 400))
    }

    // Update status to processing
    bulkUpload.status = "processing"
    bulkUpload.processingStartedAt = new Date()
    await bulkUpload.save()

    try {
      // Read and parse PDF
      const dataBuffer = fs.readFileSync(bulkUpload.filePath)
      const data = await pdfParse(dataBuffer)

      // Extract text content
      const textContent = data.text

      // Simple text parsing (this is a basic implementation)
      // In a real scenario, you might want to use more sophisticated parsing
      const lines = textContent.split('\n').filter(line => line.trim())
      
      const extractedData = []
      let rowNumber = 1

      for (const line of lines) {
        // Basic parsing logic - this would need to be customized based on PDF format
        const parts = line.split(/\s+/)
        if (parts.length >= 3) {
          const visitorData = {
            visitorName: parts[0] + ' ' + parts[1],
            visitorId: parts[2] || '',
            nationalId: parts[3] || '',
            visitorPhone: parts[4] || '',
            purpose: parts.slice(5).join(' ') || 'Bulk import',
            department: req.user.department,
            scheduledDate: new Date().toISOString().slice(0, 10),
            scheduledTime: '09:00',
            companyName: '',
            groupSize: 1,
            originDepartment: req.user.department,
            rowNumber,
            status: 'pending',
          }
          extractedData.push(visitorData)
        }
        rowNumber++
      }

      // Update bulk upload with extracted data
      bulkUpload.extractedData = extractedData
      bulkUpload.processingResult.totalVisitors = extractedData.length
      bulkUpload.status = "completed"
      bulkUpload.processingCompletedAt = new Date()
      await bulkUpload.save()

      res.json({
        success: true,
        message: "PDF processed successfully",
        bulkUpload,
      })
    } catch (processingError) {
      bulkUpload.status = "failed"
      bulkUpload.processingCompletedAt = new Date()
      await bulkUpload.save()

      return next(new AppError("Failed to process PDF: " + processingError.message, 500))
    }
  } catch (error) {
    next(error)
  }
}

// Import visitors from processed PDF
const importVisitors = async (req, res, next) => {
  try {
    const { id } = req.params
    const { selectedRows } = req.body // Array of row numbers to import

    const bulkUpload = await BulkUpload.findById(id)
    if (!bulkUpload) {
      return next(new AppError("Bulk upload not found", 404))
    }

    if (bulkUpload.status !== "completed") {
      return next(new AppError("PDF must be processed before importing", 400))
    }

    // Check if user owns this upload or is admin
    if (bulkUpload.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return next(new AppError("Not authorized to import from this upload", 403))
    }

    const rowsToImport = selectedRows || bulkUpload.extractedData.map(item => item.rowNumber)
    const successfulImports = []
    const failedImports = []

    for (const rowNumber of rowsToImport) {
      const visitorData = bulkUpload.extractedData.find(item => item.rowNumber === rowNumber)
      
      if (!visitorData || visitorData.status === 'imported') {
        continue
      }

      try {
        // Create visitor request
        const visitorRequest = await VisitorRequest.create({
          visitorName: visitorData.visitorName,
          visitorId: visitorData.visitorId,
          nationalId: visitorData.nationalId,
          visitorPhone: visitorData.visitorPhone,
          purpose: visitorData.purpose,
          department: req.user.department,
          location: req.user.location,
          isGroupVisit: visitorData.groupSize > 1,
          companyName: visitorData.companyName,
          groupSize: visitorData.groupSize,
          originDepartment: visitorData.originDepartment,
          scheduledDate: visitorData.scheduledDate,
          scheduledTime: visitorData.scheduledTime,
          requestedBy: req.user._id,
          visitDuration: { hours: 1, days: 0 },
          priority: "medium",
          status: "pending",
        })

        // Mark as imported
        visitorData.status = 'imported'
        visitorData.importedAt = new Date()
        visitorData.importedRequestId = visitorRequest._id

        successfulImports.push({
          rowNumber,
          visitorName: visitorData.visitorName,
          requestId: visitorRequest._id,
        })
      } catch (importError) {
        failedImports.push({
          rowNumber,
          visitorName: visitorData.visitorName,
          error: importError.message,
        })
      }
    }

    // Update bulk upload with import results
    bulkUpload.importResult = {
      successfulImports: successfulImports.length,
      failedImports: failedImports.length,
      details: { successfulImports, failedImports },
    }
    await bulkUpload.save()

    res.json({
      success: true,
      message: "Import completed",
      importResult: bulkUpload.importResult,
    })
  } catch (error) {
    next(error)
  }
}

// Get all bulk uploads for user
const getBulkUploads = async (req, res, next) => {
  try {
    const query = {}
    
    // Role-based filtering
    if (req.user.role !== "admin") {
      query.uploadedBy = req.user._id
    }

    const bulkUploads = await BulkUpload.find(query)
      .populate("uploadedBy", "fullName username")
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      bulkUploads,
    })
  } catch (error) {
    next(error)
  }
}

// Get bulk upload by ID
const getBulkUploadById = async (req, res, next) => {
  try {
    const { id } = req.params

    const bulkUpload = await BulkUpload.findById(id)
      .populate("uploadedBy", "fullName username")

    if (!bulkUpload) {
      return next(new AppError("Bulk upload not found", 404))
    }

    // Check if user owns this upload or is admin
    if (bulkUpload.uploadedBy._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return next(new AppError("Not authorized to view this upload", 403))
    }

    res.json({
      success: true,
      bulkUpload,
    })
  } catch (error) {
    next(error)
  }
}

// Get upload permissions (admin only)
const getUploadPermissions = async (req, res, next) => {
  try {
    const permissions = await BulkUploadPermission.find().sort({ departmentType: 1 })

    res.json({
      success: true,
      permissions,
    })
  } catch (error) {
    next(error)
  }
}

// Update upload permission (admin only)
const updateUploadPermission = async (req, res, next) => {
  try {
    const { id } = req.params
    const { canUpload, isActive, allowedTimeWindows } = req.body

    const permission = await BulkUploadPermission.findByIdAndUpdate(
      id,
      { canUpload, isActive, allowedTimeWindows },
      { new: true, runValidators: true }
    )

    if (!permission) {
      return next(new AppError("Permission not found", 404))
    }

    res.json({
      success: true,
      message: "Permission updated successfully",
      permission,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  uploadPDF,
  processPDF,
  importVisitors,
  getBulkUploads,
  getBulkUploadById,
  getUploadPermissions,
  updateUploadPermission,
}
