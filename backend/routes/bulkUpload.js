const express = require("express")
const multer = require("multer")
const path = require("path")
const { auth, authorize } = require("../middleware/auth")
const {
  uploadPDF,
  processPDF,
  importVisitors,
  getBulkUploads,
  getBulkUploadById,
  getUploadPermissions,
  updateUploadPermission,
} = require("../controllers/bulkUploadController")

const router = express.Router()

// Multer storage config for PDF uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/bulk"))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, "bulk-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'), false)
    }
  }
})

// All routes require authentication
router.use(auth)

// Bulk upload routes (for wing, director, division users)
router.post(
  "/upload",
  authorize("department_user"),
  upload.single("pdf"),
  uploadPDF
)

router.post(
  "/process/:id",
  authorize("department_user"),
  processPDF
)

router.post(
  "/import/:id",
  authorize("department_user"),
  importVisitors
)

router.get(
  "/uploads",
  authorize("department_user"),
  getBulkUploads
)

router.get(
  "/uploads/:id",
  authorize("department_user"),
  getBulkUploadById
)

// Admin routes for managing upload permissions
router.get(
  "/permissions",
  authorize("admin"),
  getUploadPermissions
)

router.patch(
  "/permissions/:departmentType",
  authorize("admin"),
  updateUploadPermission
)

module.exports = router 