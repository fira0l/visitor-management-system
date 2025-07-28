const AuditLog = require("../models/AuditLog");
const User = require("../models/User");
const { AppError } = require("../utils/appError");

// Record an audit log event
exports.record = async ({ action, performedBy, targetUser, details, context }) => {
  try {
    const performer = await User.findById(performedBy);
    if (!performer) throw new Error("Performer not found");
    let target = null;
    if (targetUser) {
      target = await User.findById(targetUser);
    }
    await AuditLog.create({
      action,
      performedBy,
      performedByEmployeeId: performer.employeeId,
      targetUser: targetUser || undefined,
      targetUserEmployeeId: target ? target.employeeId : undefined,
      details: details || {},
      context: context || "",
    });
  } catch (error) {
    // Optionally log error
    console.error("Failed to record audit log:", error);
  }
};

// Get audit logs (admin only)
exports.getLogs = async (req, res, next) => {
  try {
    const { action, performedBy, targetUser, limit = 100 } = req.query;
    const query = {};
    if (action) query.action = action;
    if (performedBy) query.performedBy = performedBy;
    if (targetUser) query.targetUser = targetUser;
    const logs = await AuditLog.find(query)
      .populate("performedBy", "fullName employeeId username")
      .populate("targetUser", "fullName employeeId username")
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    res.json({ success: true, logs });
  } catch (error) {
    next(error);
  }
}; 