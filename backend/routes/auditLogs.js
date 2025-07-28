const express = require("express");
const auditLogController = require("../controllers/auditLogController");
const { auth, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(auth);

// Get audit logs (admin only)
router.get("/", authorize("admin"), auditLogController.getLogs);

module.exports = router; 