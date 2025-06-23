const VisitorRequest = require("../models/VisitorRequest")
const CheckInOut = require("../models/CheckInOut")
const { AppError } = require("../utils/appError")

const createRequest = async (req, res, next) => {
  try {
    // Handle photo upload
    let photoPath = null;
    if (req.file) {
      // Store relative path for serving
      photoPath = `/uploads/${req.file.filename}`;
    }

    // Ensure nationalId is present
    const { nationalId, ...rest } = req.body;
    if (!nationalId) {
      return res.status(400).json({ success: false, message: "National ID is required" });
    }

    const visitorRequest = await VisitorRequest.create({
      ...rest,
      nationalId,
      photo: photoPath,
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
    await request.populate(["requestedBy", "reviewedBy"])

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
          declined: {
            $sum: { $cond: [{ $eq: ["$status", "declined"] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          checkedIn: {
            $sum: { $cond: [{ $eq: ["$status", "checked_in"] }, 1, 0] },
          },
          checkedOut: {
            $sum: { $cond: [{ $eq: ["$status", "checked_out"] }, 1, 0] },
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

// Admin: Update any visitor request
const updateRequest = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.photo = `/uploads/${req.file.filename}`;
    }
    // Prevent changing requestedBy/department via update
    delete updateData.requestedBy;
    delete updateData.department;

    const request = await VisitorRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!request) {
      return res.status(404).json({ success: false, message: "Visitor request not found" });
    }
    res.json({ success: true, message: "Visitor request updated", request });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete any visitor request
const deleteRequest = async (req, res, next) => {
  try {
    const request = await VisitorRequest.findByIdAndDelete(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Visitor request not found" });
    }
    res.json({ success: true, message: "Visitor request deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getRequests,
  reviewRequest,
  checkIn,
  checkOut,
  getAnalytics,
  updateRequest,
  deleteRequest,
}
