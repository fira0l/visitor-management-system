# API Changes Documentation

## Breaking Changes

### 1. Removed Security Approval Endpoint
**REMOVED**: `PATCH /api/visitors/requests/:id/review`

This endpoint has been completely removed as security personnel no longer approve visitor requests.

### 2. New Approval Endpoints

#### Initial Approval (Division Head)
```http
PATCH /api/visitors/requests/:id/approve
```
**Authorization**: Division Head only
**Body**:
```json
{
  "approvalType": "own_risk" | "division_approval",
  "approvalComments": "string (optional)"
}
```

#### Division Final Approval
```http
PATCH /api/visitors/requests/:id/division-approval
```
**Authorization**: Division Head (same department)
**Body**:
```json
{
  "status": "approved" | "declined",
  "approvalComments": "string (required)"
}
```

## Updated Response Objects

### Visitor Request Object
```json
{
  "_id": "request_id",
  "visitorName": "John Visitor",
  "status": "approved",
  
  // NEW FIELDS
  "approvalType": "own_risk",
  "approvedBy": {
    "_id": "user_id",
    "fullName": "Jane Division Head",
    "username": "jane.head",
    "department": "IT Department"
  },
  "approvedAt": "2024-01-15T10:30:00.000Z",
  "approvalComments": "Approved for system maintenance",
  
  // EXISTING FIELDS (unchanged)
  "requestedBy": { ... },
  "reviewedBy": { ... },
  "createdAt": "2024-01-15T09:00:00.000Z"
}
```

### Analytics Response
```json
{
  "success": true,
  "analytics": {
    "totalRequests": 150,
    "approvedRequests": 120,
    "declinedRequests": 15,
    "pendingRequests": 10,
    "pendingDivisionApproval": 5,  // NEW
    "checkedInRequests": 100,
    "checkedOutRequests": 95
  }
}
```

## Status Values

### New Status
- `pending_division_approval` - Request awaiting division head approval

### Updated Status Enum
```javascript
["pending", "approved", "declined", "checked_in", "checked_out", "expired", "pending_division_approval"]
```

## Authorization Changes

### Before
```javascript
// Security could approve
router.patch("/requests/:id/review", authorize("security"), reviewRequest)
```

### After
```javascript
// Only division heads can approve
router.patch("/requests/:id/approve", authorize("department_user"), approveRequest)
router.patch("/requests/:id/division-approval", authorize("department_user"), divisionApproval)
```

## Error Responses

### New Error Cases
```json
// Non-division head trying to approve
{
  "success": false,
  "message": "Only division heads can approve requests",
  "statusCode": 403
}

// Cross-department approval attempt
{
  "success": false,
  "message": "Only division head of the same department can approve this request",
  "statusCode": 403
}

// Invalid approval type
{
  "success": false,
  "message": "Invalid approval type. Must be own_risk or division_approval.",
  "statusCode": 400
}
```

## Frontend Integration Guide

### 1. Update Approval UI
```javascript
// Replace security approval with division head approval
const handleApproval = async (requestId, approvalType, comments) => {
  const response = await fetch(`/api/visitors/requests/${requestId}/approve`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      approvalType,
      approvalComments: comments
    })
  });
};
```

### 2. Handle New Status
```javascript
const getStatusBadge = (status) => {
  switch(status) {
    case 'pending_division_approval':
      return <Badge color="yellow">Pending Division Approval</Badge>;
    // ... other cases
  }
};
```

### 3. Display Approved By
```javascript
const ApprovalInfo = ({ request }) => (
  <div>
    {request.approvedBy && (
      <p>Approved by: {request.approvedBy.fullName}</p>
    )}
    {request.approvalComments && (
      <p>Comments: {request.approvalComments}</p>
    )}
  </div>
);
```

## Migration Checklist

### Backend
- [x] Update VisitorRequest model
- [x] Replace reviewRequest with approveRequest/divisionApproval
- [x] Update routes authorization
- [x] Add approvedBy to populate calls
- [x] Update analytics

### Frontend (Required Updates)
- [ ] Remove security approval UI
- [ ] Add division head approval options
- [ ] Handle pending_division_approval status
- [ ] Display approved by information
- [ ] Update role-based navigation
- [ ] Test approval workflows

### Database
- [ ] No migration required (backward compatible)
- [ ] Optional: Add indexes for new fields