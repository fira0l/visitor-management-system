const express = require("express")
const VisitorRequest = require("../models/VisitorRequest")
const CheckInOut = require("../models/CheckInOut")
const { auth, authorize } = require("../middleware/auth")
const { validateVisitorRequest } = require("../middleware/validation")
const {
  createRequest,
  getRequests,
  reviewRequest,
  checkIn,
  checkOut,
  getAnalytics,
} = require("../controllers/visitorController")

const router = express.Router()

// All routes require authentication
router.use(auth)

// Department user routes
router.post("/request", authorize("department_user"), validateVisitorRequest, createRequest)

// Common routes (role-based filtering in controller)
router.get("/requests", getRequests)

// Security team routes
router.patch("/requests/:id/review", authorize("security"), reviewRequest)

// Gate security routes
router.post("/checkin/:id", authorize("gate"), checkIn)
router.patch("/checkout/:id", authorize("gate"), checkOut)

// Admin routes
router.get("/analytics", authorize("admin"), getAnalytics)

module.exports = router
