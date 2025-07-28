const Delegation = require("../models/Delegation");
const User = require("../models/User");
const { AppError } = require("../utils/appError");

// Request delegation
exports.requestDelegation = async (req, res, next) => {
  try {
    const { requestedTo, reason, startDate, endDate, permissions } = req.body;
    
    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      return next(new AppError("End date must be after start date", 400));
    }
    
    // Check if target user exists and is appropriate for delegation
    const targetUser = await User.findById(requestedTo);
    if (!targetUser) {
      return next(new AppError("Target user not found", 404));
    }
    
    // Only wing users can request delegation to director/division
    if (req.user.departmentType === 'wing') {
      if (!['director', 'division'].includes(targetUser.departmentType)) {
        return next(new AppError("Wing users can only delegate to director or division users", 400));
      }
    }
    
    // Check for existing active delegation
    const existingDelegation = await Delegation.findOne({
      requestedBy: req.user._id,
      status: { $in: ['pending', 'approved', 'active'] },
      isActive: true,
    });
    
    if (existingDelegation) {
      return next(new AppError("You already have an active delegation request", 400));
    }
    
    const delegation = await Delegation.create({
      requestedBy: req.user._id,
      requestedTo,
      reason,
      startDate,
      endDate,
      permissions: permissions || {},
    });
    
    await delegation.populate([
      { path: 'requestedBy', select: 'fullName employeeId department departmentType' },
      { path: 'requestedTo', select: 'fullName employeeId department departmentType' },
    ]);
    
    res.status(201).json({
      success: true,
      message: "Delegation request created successfully",
      delegation,
    });
  } catch (error) {
    next(error);
  }
};

// Get delegation requests (for admin and target users)
exports.getDelegationRequests = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    let query = { isActive: true };
    
    if (status) {
      query.status = status;
    }
    
    // Filter based on user role and type
    if (req.user.role === 'admin') {
      // Admin sees all delegations
    } else if (type === 'received') {
      // User sees delegations requested to them
      query.requestedTo = req.user._id;
    } else {
      // User sees their own delegation requests
      query.requestedBy = req.user._id;
    }
    
    const delegations = await Delegation.find(query)
      .populate('requestedBy', 'fullName employeeId department departmentType')
      .populate('requestedTo', 'fullName employeeId department departmentType')
      .populate('approvedBy', 'fullName employeeId')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      delegations,
    });
  } catch (error) {
    next(error);
  }
};

// Approve/reject delegation (admin only)
exports.reviewDelegation = async (req, res, next) => {
  try {
    const { delegationId } = req.params;
    const { status, rejectionReason } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return next(new AppError("Invalid status", 400));
    }
    
    const delegation = await Delegation.findById(delegationId);
    if (!delegation) {
      return next(new AppError("Delegation not found", 404));
    }
    
    if (delegation.status !== 'pending') {
      return next(new AppError("Delegation is not pending", 400));
    }
    
    delegation.status = status;
    delegation.approvedBy = req.user._id;
    delegation.approvedAt = new Date();
    
    if (status === 'rejected' && rejectionReason) {
      delegation.rejectionReason = rejectionReason;
    }
    
    await delegation.save();
    
    await delegation.populate([
      { path: 'requestedBy', select: 'fullName employeeId department departmentType' },
      { path: 'requestedTo', select: 'fullName employeeId department departmentType' },
      { path: 'approvedBy', select: 'fullName employeeId' },
    ]);
    
    res.json({
      success: true,
      message: `Delegation ${status} successfully`,
      delegation,
    });
  } catch (error) {
    next(error);
  }
};

// Activate delegation (when start date is reached)
exports.activateDelegation = async (req, res, next) => {
  try {
    const { delegationId } = req.params;
    
    const delegation = await Delegation.findById(delegationId);
    if (!delegation) {
      return next(new AppError("Delegation not found", 404));
    }
    
    if (delegation.status !== 'approved') {
      return next(new AppError("Delegation is not approved", 400));
    }
    
    const now = new Date();
    if (now < delegation.startDate) {
      return next(new AppError("Delegation start date has not been reached", 400));
    }
    
    if (now > delegation.endDate) {
      delegation.status = 'completed';
      await delegation.save();
      return next(new AppError("Delegation has expired", 400));
    }
    
    delegation.status = 'active';
    await delegation.save();
    
    // Update user delegation status
    await User.findByIdAndUpdate(delegation.requestedTo, {
      isDelegated: true,
      delegatedBy: delegation.requestedBy,
      delegationReason: delegation.reason,
      delegationStartDate: delegation.startDate,
      delegationEndDate: delegation.endDate,
    });
    
    res.json({
      success: true,
      message: "Delegation activated successfully",
      delegation,
    });
  } catch (error) {
    next(error);
  }
};

// Cancel delegation
exports.cancelDelegation = async (req, res, next) => {
  try {
    const { delegationId } = req.params;
    
    const delegation = await Delegation.findById(delegationId);
    if (!delegation) {
      return next(new AppError("Delegation not found", 404));
    }
    
    if (!['pending', 'approved', 'active'].includes(delegation.status)) {
      return next(new AppError("Delegation cannot be cancelled", 400));
    }
    
    // Only the requester or admin can cancel
    if (delegation.requestedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError("Not authorized to cancel this delegation", 403));
    }
    
    delegation.status = 'cancelled';
    await delegation.save();
    
    // Remove delegation from user if active
    if (delegation.status === 'active') {
      await User.findByIdAndUpdate(delegation.requestedTo, {
        isDelegated: false,
        delegatedBy: null,
        delegationReason: null,
        delegationStartDate: null,
        delegationEndDate: null,
      });
    }
    
    res.json({
      success: true,
      message: "Delegation cancelled successfully",
      delegation,
    });
  } catch (error) {
    next(error);
  }
};

// Get active delegations for a user
exports.getActiveDelegations = async (req, res, next) => {
  try {
    const activeDelegations = await Delegation.find({
      requestedTo: req.user._id,
      status: 'active',
      isActive: true,
    }).populate('requestedBy', 'fullName employeeId department departmentType');
    
    res.json({
      success: true,
      delegations: activeDelegations,
    });
  } catch (error) {
    next(error);
  }
}; 