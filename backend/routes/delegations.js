const express = require("express");
const delegationController = require("../controllers/delegationController");
const { auth, authorize } = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(auth);

// Request delegation (wing users only)
router.post("/request", authorize("department_user"), delegationController.requestDelegation);

// Get delegation requests
router.get("/", delegationController.getDelegationRequests);

// Review delegation (admin only)
router.patch("/:delegationId/review", authorize("admin"), delegationController.reviewDelegation);

// Activate delegation
router.patch("/:delegationId/activate", delegationController.activateDelegation);

// Cancel delegation
router.patch("/:delegationId/cancel", delegationController.cancelDelegation);

// Get active delegations for current user
router.get("/active", delegationController.getActiveDelegations);

module.exports = router; 