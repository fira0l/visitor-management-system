const express = require("express")
const VisitorRequest = require("../models/VisitorRequest")
const CheckInOut = require("../models/CheckInOut")
const { auth, authorize } = require("../middleware/auth")
const { validateVisitorRequest } = require("../middleware/validation")
const {
  createRequest,
  getRequests,
  getRequest,
  approveRequest,
  divisionApproval,
  checkIn,
  checkOut,
  getAnalytics,
  updateRequest,
  deleteRequest,
  getVisitorHistory,
  reuseVisitorData,
} = require("../controllers/visitorController")
const multer = require("multer")
const path = require("path")

const router = express.Router()

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  },
})
const upload = multer({ storage })

// All routes require authentication
router.use(auth)

// Department user routes
router.post(
  "/request",
  authorize("department_user"),
  upload.single("photo"),
  validateVisitorRequest,
  createRequest
)

// Common routes (role-based filtering in controller)
router.get("/requests", getRequests)
router.get("/requests/:id", getRequest)

// New routes for history and reuse
router.get("/history", getVisitorHistory)
router.post("/requests/:originalRequestId/reuse", reuseVisitorData)

// Division head routes
router.patch("/requests/:id/approve", authorize("department_user"), approveRequest)
router.patch("/requests/:id/division-approval", authorize("department_user"), divisionApproval)

// Gate security routes
router.post("/checkin/:id", authorize("gate"), checkIn)
router.patch("/checkout/:id", authorize("gate"), checkOut)

// Admin routes
router.get("/analytics", authorize("admin"), getAnalytics)

// Admin: update and delete visitor requests
router.patch(
  "/requests/:id",
  authorize("admin"),
  upload.single("photo"),
  updateRequest
)
router.delete(
  "/requests/:id",
  authorize("admin"),
  deleteRequest
)

module.exports = router
