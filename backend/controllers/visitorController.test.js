const visitorController = require('./visitorController');
const VisitorRequest = require('../models/VisitorRequest');
const CheckInOut = require('../models/CheckInOut');
const AppError = require('../utils/appError');

jest.mock('../models/VisitorRequest');
jest.mock('../models/CheckInOut');
jest.mock('../utils/appError');

describe('Visitor Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      user: {},
      params: {},
      body: {},
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test cases will be added here

  describe('createRequest', () => {
    it('should allow a department user to create a visitor request', async () => {
      mockReq.user = { _id: 'deptUserId', department: 'Engineering', role: 'department_user' };
      mockReq.body = {
        visitorName: 'John Doe',
        purpose: 'Interview',
        vehicleNumber: 'XYZ123',
        expectedDate: new Date().toISOString(),
      };

      const mockCreatedRequest = {
        ...mockReq.body,
        _id: 'newRequestId',
        requestedBy: 'deptUserId',
        department: 'Engineering',
        status: 'pending',
        // Add other fields that are set by default or in the controller
      };
      VisitorRequest.create.mockResolvedValue(mockCreatedRequest);

      await visitorController.createRequest(mockReq, mockRes, mockNext);

      expect(VisitorRequest.create).toHaveBeenCalledWith({
        ...mockReq.body,
        requestedBy: 'deptUserId',
        department: 'Engineering',
        // status: 'pending' is implicitly set by the model's default
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          request: mockCreatedRequest,
        },
      });
    });

    it('should call next with AppError if VisitorRequest.create fails', async () => {
      mockReq.user = { _id: 'deptUserId', department: 'Engineering', role: 'department_user' };
      mockReq.body = { /* ... request body ... */ };
      const error = new Error('Creation failed');
      VisitorRequest.create.mockRejectedValue(error);

      await visitorController.createRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getRequests', () => {
    it('should allow a security user to view pending, approved, and declined requests', async () => {
      mockReq.user = { role: 'security' };
      mockReq.query = { page: '1', limit: '10', status: 'pending,approved,declined' }; // Simulating query params

      const mockRequests = [{ _id: 'req1', status: 'pending' }, { _id: 'req2', status: 'approved' }];
      VisitorRequest.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockRequests),
      });
      VisitorRequest.countDocuments.mockResolvedValue(mockRequests.length);

      await visitorController.getRequests(mockReq, mockRes, mockNext);

      expect(VisitorRequest.find).toHaveBeenCalledWith({
        status: { $in: ['pending', 'approved', 'declined'] },
        // department filter should not be applied for security user
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        results: mockRequests.length,
        data: {
          requests: mockRequests,
        },
        totalPages: 1,
        currentPage: 1,
      });
    });

    it('should call next with error if VisitorRequest.find fails for security user', async () => {
      mockReq.user = { role: 'security' };
      mockReq.query = { page: '1', limit: '10' };
      const error = new Error('Find failed');
      VisitorRequest.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(error),
      });

      await visitorController.getRequests(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('reviewRequest', () => {
    it('should allow a security user to approve a pending request', async () => {
      const requestId = 'testRequestId';
      const mockPendingRequest = {
        _id: requestId,
        status: 'pending',
        visitorName: 'Jane Doe',
        save: jest.fn().mockResolvedValue(this), // 'this' refers to the object itself
        populate: jest.fn().mockResolvedValue(this),
      };
      VisitorRequest.findById.mockResolvedValue(mockPendingRequest);

      mockReq.user = { _id: 'securityUserId', role: 'security' };
      mockReq.params.id = requestId;
      mockReq.body = { status: 'approved' };

      // For the populate chain
      const populatedRequest = { ...mockPendingRequest, status: 'approved', reviewedBy: 'securityUserId', reviewedAt: expect.any(Date) };
      mockPendingRequest.populate.mockResolvedValue(populatedRequest); // Ensure populate returns the modified object
      mockPendingRequest.save.mockResolvedValue(populatedRequest);


      await visitorController.reviewRequest(mockReq, mockRes, mockNext);

      expect(VisitorRequest.findById).toHaveBeenCalledWith(requestId);
      expect(mockPendingRequest.status).toBe('approved');
      expect(mockPendingRequest.reviewedBy).toBe('securityUserId');
      expect(mockPendingRequest.reviewedAt).toBeInstanceOf(Date);
      expect(mockPendingRequest.save).toHaveBeenCalled();
      expect(mockPendingRequest.populate).toHaveBeenCalledWith('requestedBy', 'name department');
      expect(mockPendingRequest.populate).toHaveBeenCalledWith('reviewedBy', 'name');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          request: populatedRequest,
        },
      });
    });

    it('should allow a security user to decline a pending request', async () => {
      const requestId = 'testRequestId';
      const mockPendingRequest = {
        _id: requestId,
        status: 'pending',
        visitorName: 'Jane Doe',
        save: jest.fn().mockResolvedValue(this),
        populate: jest.fn().mockResolvedValue(this),
      };
      VisitorRequest.findById.mockResolvedValue(mockPendingRequest);

      mockReq.user = { _id: 'securityUserId', role: 'security' };
      mockReq.params.id = requestId;
      mockReq.body = { status: 'declined', declineReason: 'Invalid reason' };

      const populatedRequest = { ...mockPendingRequest, status: 'declined', reviewedBy: 'securityUserId', reviewedAt: expect.any(Date), declineReason: 'Invalid reason' };
      mockPendingRequest.populate.mockResolvedValue(populatedRequest);
      mockPendingRequest.save.mockResolvedValue(populatedRequest);


      await visitorController.reviewRequest(mockReq, mockRes, mockNext);

      expect(VisitorRequest.findById).toHaveBeenCalledWith(requestId);
      expect(mockPendingRequest.status).toBe('declined');
      expect(mockPendingRequest.declineReason).toBe('Invalid reason');
      expect(mockPendingRequest.reviewedBy).toBe('securityUserId');
      expect(mockPendingRequest.reviewedAt).toBeInstanceOf(Date);
      expect(mockPendingRequest.save).toHaveBeenCalled();
      expect(mockPendingRequest.populate).toHaveBeenCalledWith('requestedBy', 'name department');
      expect(mockPendingRequest.populate).toHaveBeenCalledWith('reviewedBy', 'name');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          request: populatedRequest,
        },
      });
    });

    it('should return 404 if request not found for review', async () => {
      VisitorRequest.findById.mockResolvedValue(null);
      mockReq.params.id = 'nonExistentId';
      mockReq.user = { role: 'security' };
      mockReq.body = { status: 'approved' };

      await visitorController.reviewRequest(mockReq, mockRes, mockNext);

      expect(AppError).toHaveBeenCalledWith('No visitor request found with that ID', 404);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should return 400 if status is invalid for review', async () => {
        const requestId = 'testRequestId';
        const mockRequest = { _id: requestId, status: 'pending', save: jest.fn(), populate: jest.fn().mockReturnThis() };
        VisitorRequest.findById.mockResolvedValue(mockRequest);
        mockReq.params.id = requestId;
        mockReq.user = { role: 'security' };
        mockReq.body = { status: 'invalid_status' }; // Invalid status

        await visitorController.reviewRequest(mockReq, mockRes, mockNext);

        expect(AppError).toHaveBeenCalledWith('Invalid status update. Only "approved" or "declined" are allowed.', 400);
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should return 400 if trying to review a non-pending request', async () => {
      const requestId = 'testRequestId';
      const mockApprovedRequest = { _id: requestId, status: 'approved', save: jest.fn(), populate: jest.fn().mockReturnThis() };
      VisitorRequest.findById.mockResolvedValue(mockApprovedRequest);
      mockReq.params.id = requestId;
      mockReq.user = { role: 'security' };
      mockReq.body = { status: 'approved' };

      await visitorController.reviewRequest(mockReq, mockRes, mockNext);

      expect(AppError).toHaveBeenCalledWith('This request has already been reviewed and cannot be changed.', 400);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  // Merged getRequests describe block
  describe('getRequests', () => {
    // Test for security user (already existing)
    it('should allow a security user to view pending, approved, and declined requests', async () => {
      mockReq.user = { role: 'security' };
      mockReq.query = { page: '1', limit: '10', status: 'pending,approved,declined' };

      const mockRequestsList = [{ _id: 'req1', status: 'pending' }, { _id: 'req2', status: 'approved' }];
      VisitorRequest.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockRequestsList),
      });
      VisitorRequest.countDocuments.mockResolvedValue(mockRequestsList.length);

      await visitorController.getRequests(mockReq, mockRes, mockNext);

      expect(VisitorRequest.find).toHaveBeenCalledWith({
        status: { $in: ['pending', 'approved', 'declined'] },
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        results: mockRequestsList.length,
        data: {
          requests: mockRequestsList,
        },
      }));
    });

    it('should call next with error if VisitorRequest.find fails for security user', async () => {
      mockReq.user = { role: 'security' };
      mockReq.query = { page: '1', limit: '10' };
      const error = new Error('Find failed');
      VisitorRequest.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(error),
      });

      await visitorController.getRequests(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    // Test for gate user (newly added and merged)
    it('should allow a gate user to view approved and checked_in requests', async () => {
      mockReq.user = { role: 'gate' };
      mockReq.query = { page: '1', limit: '10', status: 'approved,checked_in' };

      const mockGateRequests = [{ _id: 'req3', status: 'approved' }, { _id: 'req4', status: 'checked_in' }];
      VisitorRequest.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockGateRequests),
      });
      VisitorRequest.countDocuments.mockResolvedValue(mockGateRequests.length);

      await visitorController.getRequests(mockReq, mockRes, mockNext);

      expect(VisitorRequest.find).toHaveBeenCalledWith({
        status: { $in: ['approved', 'checked_in'] },
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        results: mockGateRequests.length,
        data: {
          requests: mockGateRequests,
        },
      }));
    });

    it('should call next with error if VisitorRequest.find fails for gate user', async () => {
        mockReq.user = { role: 'gate' };
        mockReq.query = { page: '1', limit: '10' };
        const error = new Error('Find failed for gate user');
        VisitorRequest.find.mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockRejectedValue(error),
        });

        await visitorController.getRequests(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalledWith(error);
    });

    // Add other role tests for getRequests if necessary, e.g., department_user
    it('should allow a department user to view their own requests', async () => {
      mockReq.user = { _id: 'deptUserId', department: 'Engineering', role: 'department_user' };
      mockReq.query = { page: '1', limit: '10' }; // status can be any or specific

      const mockDeptRequests = [{ _id: 'req5', requestedBy: 'deptUserId' }];
      VisitorRequest.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockDeptRequests),
      });
      VisitorRequest.countDocuments.mockResolvedValue(mockDeptRequests.length);

      await visitorController.getRequests(mockReq, mockRes, mockNext);

      expect(VisitorRequest.find).toHaveBeenCalledWith({
        department: 'Engineering', // or requestedBy: 'deptUserId' based on controller logic
        // status: { $in: [...] } // if controller specifies default statuses
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        results: mockDeptRequests.length,
      }));
    });

  });

  describe('checkIn', () => {
    it('should allow a gate user to check in an approved request', async () => {
      const requestId = 'approvedReqId';
      const mockApprovedRequest = {
        _id: requestId,
        status: 'approved',
        visitorName: 'Visitor CheckIn',
        save: jest.fn().mockResolvedValue(this),
        populate: jest.fn().mockReturnThis(), // For potential populate calls
      };
      VisitorRequest.findById.mockResolvedValue(mockApprovedRequest);
      CheckInOut.findOne.mockResolvedValue(null); // Not already checked in

      const mockCheckInRecord = {
        _id: 'checkInId',
        visitorRequest: requestId,
        checkInTime: expect.any(Date),
        checkInBy: 'gateUserId',
        // ... other fields from req.body
      };
      CheckInOut.create.mockResolvedValue(mockCheckInRecord);

      // Mock the save on the VisitorRequest instance to reflect status update
      mockApprovedRequest.save.mockImplementationOnce(function() {
        this.status = 'checked_in';
        return Promise.resolve(this);
      });
      // Mock populate to return the (now modified) request
       const populatedAndSavedRequest = { ...mockApprovedRequest, status: 'checked_in' };
       mockApprovedRequest.populate.mockResolvedValue(populatedAndSavedRequest);


      mockReq.user = { _id: 'gateUserId', role: 'gate' };
      mockReq.params.id = requestId;
      mockReq.body = { gateNumber: 'Gate 1', securityOfficer: 'Officer K' };

      await visitorController.checkIn(mockReq, mockRes, mockNext);

      expect(VisitorRequest.findById).toHaveBeenCalledWith(requestId);
      expect(CheckInOut.findOne).toHaveBeenCalledWith({ visitorRequest: requestId, checkOutTime: null });
      expect(mockApprovedRequest.status).toBe('checked_in'); // Status updated before save
      expect(mockApprovedRequest.save).toHaveBeenCalled();
      expect(CheckInOut.create).toHaveBeenCalledWith({
        visitorRequest: requestId,
        checkInBy: 'gateUserId',
        checkInTime: expect.any(Date),
        ...mockReq.body,
      });
       expect(mockApprovedRequest.populate).toHaveBeenCalledWith('requestedBy', 'name department');
       expect(mockApprovedRequest.populate).toHaveBeenCalledWith('reviewedBy', 'name');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Visitor checked in successfully',
        data: {
          checkInDetails: mockCheckInRecord,
          request: populatedAndSavedRequest,
        },
      });
    });

    it('should return 404 if request not found for check-in', async () => {
      VisitorRequest.findById.mockResolvedValue(null);
      mockReq.params.id = 'nonExistentId';
      mockReq.user = { role: 'gate' };

      await visitorController.checkIn(mockReq, mockRes, mockNext);

      expect(AppError).toHaveBeenCalledWith('No visitor request found with that ID', 404);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should return 400 if request is not approved for check-in', async () => {
      const requestId = 'pendingReqId';
      const mockPendingRequest = { _id: requestId, status: 'pending' };
      VisitorRequest.findById.mockResolvedValue(mockPendingRequest);
      mockReq.params.id = requestId;
      mockReq.user = { role: 'gate' };

      await visitorController.checkIn(mockReq, mockRes, mockNext);

      expect(AppError).toHaveBeenCalledWith('This visitor request is not approved for check-in.', 400);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should return 400 if visitor already checked in and not checked out', async () => {
      const requestId = 'alreadyCheckedInReqId';
      const mockRequest = { _id: requestId, status: 'checked_in' }; // or 'approved' but CheckInOut.findOne finds a record
      VisitorRequest.findById.mockResolvedValue(mockRequest);
      CheckInOut.findOne.mockResolvedValue({ _id: 'existingCheckInId', checkOutTime: null }); // Already checked in
      mockReq.params.id = requestId;
      mockReq.user = { role: 'gate' };

      await visitorController.checkIn(mockReq, mockRes, mockNext);

      expect(AppError).toHaveBeenCalledWith('This visitor has already been checked in and not checked out.', 400);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('checkOut', () => {
    it('should allow a gate user to check out a checked-in visitor', async () => {
      const visitorRequestId = 'reqIdForCheckOut'; // This ID is for VisitorRequest
      const checkInEntryId = 'checkInEntryId'; // This ID is for the CheckInOut entry document

      const mockCheckInRecord = {
        _id: checkInEntryId,
        visitorRequest: visitorRequestId,
        checkInTime: new Date(Date.now() - 3600000), // 1 hour ago
        checkInBy: 'someGateUserId',
        checkOutTime: null,
        save: jest.fn().mockImplementationOnce(function() {
          this.checkOutTime = expect.any(Date);
          this.checkOutBy = 'gateUserIdCheckout';
          return Promise.resolve(this);
        }),
        populate: jest.fn().mockReturnThis(), // chain populate
      };
      // Find the CheckInOut record using visitorRequestId
      CheckInOut.findOne.mockResolvedValue(mockCheckInRecord);

      // Mock the population on the checkInRecord
      const populatedCheckInRecord = { ...mockCheckInRecord, checkOutTime: expect.any(Date), checkOutBy: 'gateUserIdCheckout' };
      // Make populate return the updated record for the response
      mockCheckInRecord.populate.mockResolvedValue(populatedCheckInRecord);


      // Mock the update on VisitorRequest model
      const updatedVisitorRequest = { _id: visitorRequestId, status: 'checked_out' };
      VisitorRequest.findByIdAndUpdate.mockResolvedValue(updatedVisitorRequest);

      mockReq.user = { _id: 'gateUserIdCheckout', role: 'gate' };
      mockReq.params.id = visitorRequestId; // The ID in the route is the VisitorRequest ID
      mockReq.body = { remarks: 'All clear' };


      await visitorController.checkOut(mockReq, mockRes, mockNext);

      expect(CheckInOut.findOne).toHaveBeenCalledWith({ visitorRequest: visitorRequestId, checkOutTime: null });
      expect(mockCheckInRecord.checkOutTime).toEqual(expect.any(Date));
      expect(mockCheckInRecord.checkOutBy).toBe('gateUserIdCheckout');
      expect(mockCheckInRecord.remarks).toBe('All clear'); // Assuming remarks are added to the record
      expect(mockCheckInRecord.save).toHaveBeenCalled();
      expect(VisitorRequest.findByIdAndUpdate).toHaveBeenCalledWith(visitorRequestId, { status: 'checked_out' }, { new: true });
      expect(mockCheckInRecord.populate).toHaveBeenCalledWith('visitorRequest');
      expect(mockCheckInRecord.populate).toHaveBeenCalledWith('checkInBy', 'name');
      expect(mockCheckInRecord.populate).toHaveBeenCalledWith('checkOutBy', 'name');


      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Visitor checked out successfully',
        data: {
          checkOutDetails: populatedCheckInRecord,
        },
      });
    });

    it('should return 404 if no active check-in record found for checkout', async () => {
      CheckInOut.findOne.mockResolvedValue(null);
      mockReq.params.id = 'nonExistentCheckInId';
      mockReq.user = { role: 'gate' };

      await visitorController.checkOut(mockReq, mockRes, mockNext);

      expect(AppError).toHaveBeenCalledWith('No active check-in record found for this visitor request ID.', 404);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

     it('should handle error if checkInRecord.save fails', async () => {
      const visitorRequestId = 'reqIdSaveFail';
      const mockCheckInRecord = {
        _id: 'checkInSaveFail',
        visitorRequest: visitorRequestId,
        checkOutTime: null,
        save: jest.fn().mockRejectedValue(new Error('Save failed')),
        populate: jest.fn().mockReturnThis(),
      };
      CheckInOut.findOne.mockResolvedValue(mockCheckInRecord);

      mockReq.user = { _id: 'gateUserId', role: 'gate' };
      mockReq.params.id = visitorRequestId;
      mockReq.body = { remarks: 'Test' };

      await visitorController.checkOut(mockReq, mockRes, mockNext);

      expect(mockCheckInRecord.save).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(new Error('Save failed')); // Or specific AppError if controller wraps it
    });

    it('should handle error if VisitorRequest.findByIdAndUpdate fails', async () => {
        const visitorRequestId = 'reqIdUpdateFail';
        const mockCheckInRecord = {
            _id: 'checkInUpdateFail',
            visitorRequest: visitorRequestId,
            checkOutTime: null,
            save: jest.fn().mockResolvedValue(this), // save is successful
            populate: jest.fn().mockReturnThis(),
        };
        CheckInOut.findOne.mockResolvedValue(mockCheckInRecord);
        VisitorRequest.findByIdAndUpdate.mockRejectedValue(new Error('Update failed'));

        mockReq.user = { _id: 'gateUserId', role: 'gate' };
        mockReq.params.id = visitorRequestId;

        await visitorController.checkOut(mockReq, mockRes, mockNext);

        expect(mockCheckInRecord.save).toHaveBeenCalled(); // This would have been called
        expect(VisitorRequest.findByIdAndUpdate).toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(new Error('Update failed')); // Or specific AppError
    });

  });
});
