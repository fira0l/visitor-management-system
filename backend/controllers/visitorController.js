const VisitorRequest = require("../models/VisitorRequest")
const CheckInOut = require("../models/CheckInOut")
const { AppError } = require("../utils/appError")
const { sendEmail } = require("../utils/emailService")

const createRequest = async (req, res, next) => {
  try {
    const visitorRequest = await VisitorRequest.create({
      ...req.body,
      requestedBy: req.user._id,
      department: req.user.department,
    })

    await visitorRequest.populate("requestedBy", "fullName username")

    res.status(201).json({
      success: true,
      message: "Visitor request created successfully",
      request: visitorRequest,
    })
  } catch (error) {
    next(error)
  }
}

const getRequests = async (req, res, next) => {
  try {
    const query = {}
    const { status, department, date, page = 1, limit = 10, search } = req.query

    // Role-based filtering
    switch (req.user.role) {
      case "department_user":
        query.requestedBy = req.user._id
        break
      case "security":
        query.status = { $in: ["pending", "approved", "declined"] }
        break
      case "gate":
        query.status = { $in: ["approved", "checked_in"] }
        break
      case "admin":
        // Admin can see all
        break
    }

    // Additional filters
    if (status) query.status = status
    if (department) query.department = new RegExp(department, "i")
    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      query.scheduledDate = { $gte: startDate, $lt: endDate }
    }
    if (search) {
      query.$or = [
        { visitorName: new RegExp(search, "i") },
        { visitorId: new RegExp(search, "i") },
        { approvalCode: new RegExp(search, "i") },
      ]
    }

    const requests = await VisitorRequest.find(query)
      .populate("requestedBy", "fullName username department")
      .populate("reviewedBy", "fullName username")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await VisitorRequest.countDocuments(query)

    res.json({
      success: true,
      requests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    })
  } catch (error) {
    next(error)
  }
}

const reviewRequest = async (req, res, next) => {
  try {
    const { status, reviewComments } = req.body

    if (!["approved", "declined"].includes(status)) {
      return next(new AppError("Invalid status. Must be approved or declined.", 400))
    }

    const request = await VisitorRequest.findById(req.params.id)
    if (!request) {
      return next(new AppError("Visitor request not found", 404))
    }

    if (request.status !== "pending") {
      return next(new AppError("Request has already been reviewed", 400))
    }

    request.status = status
    request.reviewedBy = req.user._id
    request.reviewedAt = new Date()
    request.reviewComments = reviewComments

    await request.save()
    // Ensure populated fields include email for requestedBy
    await request.populate([
        { path: 'requestedBy', select: 'fullName username email department' },
        { path: 'reviewedBy', select: 'fullName username' }
    ]);

    // Send email notification (best-effort)
    if (request.requestedBy && request.requestedBy.email) {
      let subject = '';
      let htmlBody = '';
      let textBody = '';

      if (request.status === 'approved') {
        subject = `Visitor Request Approved: ${request.visitorName}`;
        textBody = `Hello ${request.requestedBy.fullName},\n\nYour visitor request for ${request.visitorName} (ID: ${request.visitorId}) scheduled for ${new Date(request.scheduledDate).toLocaleDateString()} at ${request.scheduledTime} has been approved.\n\nApproval Code: ${request.approvalCode}\n\nReviewed by: ${request.reviewedBy.fullName}\nComments: ${request.reviewComments || 'N/A'}\n\nThank you,\nThe Admin Team`;
        htmlBody = `
          <p>Hello ${request.requestedBy.fullName},</p>
          <p>Your visitor request for <strong>${request.visitorName}</strong> (ID: ${request.visitorId}) scheduled for <strong>${new Date(request.scheduledDate).toLocaleDateString()} at ${request.scheduledTime}</strong> has been <strong>approved</strong>.</p>
          <p><strong>Approval Code:</strong> ${request.approvalCode}</p>
          <p><strong>Reviewed by:</strong> ${request.reviewedBy.fullName}</p>
          <p><strong>Comments:</strong> ${request.reviewComments || 'N/A'}</p>
          <p>Thank you,<br>The Admin Team</p>
        `;
      } else if (request.status === 'declined') {
        subject = `Visitor Request Declined: ${request.visitorName}`;
        textBody = `Hello ${request.requestedBy.fullName},\n\nYour visitor request for ${request.visitorName} (ID: ${request.visitorId}) scheduled for ${new Date(request.scheduledDate).toLocaleDateString()} at ${request.scheduledTime} has been declined.\n\nReviewed by: ${request.reviewedBy.fullName}\nReason: ${request.reviewComments || 'No specific reason provided.'}\n\nPlease contact support if you have any questions.\n\nThank you,\nThe Admin Team`;
        htmlBody = `
          <p>Hello ${request.requestedBy.fullName},</p>
          <p>Your visitor request for <strong>${request.visitorName}</strong> (ID: ${request.visitorId}) scheduled for <strong>${new Date(request.scheduledDate).toLocaleDateString()} at ${request.scheduledTime}</strong> has been <strong>declined</strong>.</p>
          <p><strong>Reviewed by:</strong> ${request.reviewedBy.fullName}</p>
          <p><strong>Reason:</strong> ${request.reviewComments || 'No specific reason provided.'}</p>
          <p>Please contact support if you have any questions.</p>
          <p>Thank you,<br>The Admin Team</p>
        `;
      }

      if (subject) {
        try {
          await sendEmail(request.requestedBy.email, subject, htmlBody, textBody);
          console.log(`Review notification email sent to ${request.requestedBy.email} for request ${request._id}`);
        } catch (emailError) {
          console.error(`Failed to send review notification email to ${request.requestedBy.email} for request ${request._id}:`, emailError);
          // Do not block review process if email fails
        }
      }
    } else {
        console.warn(`Could not send review email: requestedBy user or email not found for request ${request._id}`);
    }

    res.json({
      success: true,
      message: `Request ${status} successfully`,
      request,
    })
  } catch (error) {
    next(error)
  }
}

const checkIn = async (req, res, next) => {
  try {
    const { actualItemsBrought, notes } = req.body

    const request = await VisitorRequest.findById(req.params.id)
    if (!request) {
      return next(new AppError("Visitor request not found", 404))
    }

    if (request.status !== "approved") {
      return next(new AppError("Only approved requests can be checked in", 400))
    }

    // Check if already checked in
    const existingCheckIn = await CheckInOut.findOne({
      visitorRequest: request._id,
      checkOutTime: { $exists: false },
    })

    if (existingCheckIn) {
      return next(new AppError("Visitor is already checked in", 400))
    }

    // Create check-in record
    const checkIn = await CheckInOut.create({
      visitorRequest: request._id,
      checkInBy: req.user._id,
      actualItemsBrought,
      checkInNotes: notes,
    })

    // Update request status
    request.status = "checked_in"
    await request.save()

    await checkIn.populate([
      { path: "visitorRequest", populate: { path: "requestedBy" } },
      { path: "checkInBy", select: "fullName username" },
    ])

    res.json({
      success: true,
      message: "Visitor checked in successfully",
      checkIn,
    })
  } catch (error) {
    next(error)
  }
}

const checkOut = async (req, res, next) => {
  try {
    const { notes } = req.body

    const checkIn = await CheckInOut.findOne({
      visitorRequest: req.params.id,
      checkOutTime: { $exists: false },
    })

    if (!checkIn) {
      return next(new AppError("No active check-in found for this visitor", 404))
    }

    checkIn.checkOutTime = new Date()
    checkIn.checkOutBy = req.user._id
    checkIn.checkOutNotes = notes

    await checkIn.save()

    // Update request status
    await VisitorRequest.findByIdAndUpdate(req.params.id, {
      status: "checked_out",
    })

    await checkIn.populate([
      { path: "visitorRequest", populate: { path: "requestedBy" } },
      { path: "checkInBy", select: "fullName username" },
      { path: "checkOutBy", select: "fullName username" },
    ])

    res.json({
      success: true,
      message: "Visitor checked out successfully",
      checkIn,
    })
  } catch (error) {
    next(error)
  }
}

const getAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, department } = req.query

    const matchQuery = {}
    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }
    if (department) {
      matchQuery.department = department
    }

    const analytics = await VisitorRequest.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          approvedRequests: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
          },
          declinedRequests: {
            $sum: { $cond: [{ $eq: ["$status", "declined"] }, 1, 0] },
          },
          pendingRequests: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          checkedInRequests: {
            $sum: { $cond: [{ $eq: ["$status", "checked_in"] }, 1, 0] },
          },
          checkedOutRequests: {
            $sum: { $cond: [{ $eq: ["$status", "checked_out"] }, 1, 0] },
          },
        },
      },
    ])

    const departmentStats = await VisitorRequest.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
    ])

    res.json({
      success: true,
      analytics: analytics[0] || {
        totalRequests: 0,
        approvedRequests: 0,
        declinedRequests: 0,
        pendingRequests: 0,
        checkedInRequests: 0,
        checkedOutRequests: 0,
      },
      departmentStats,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createRequest,
  getRequests,
  reviewRequest,
  checkIn,
  checkOut,
  getAnalytics,
}
