# Visitor Approval Workflow Documentation

## Overview
The visitor management system now uses a **Division Head Approval System** instead of security-based approval. This provides better accountability and departmental control over visitor access.

## Key Changes

### 1. Removed Security Approval
- **Before**: Security team reviewed and approved visitor requests
- **After**: Only division heads can approve visitor requests
- **Impact**: More departmental control and accountability

### 2. Added "Approved By" Tracking
- Every approved visitor now tracks who approved the request
- Includes approval timestamp and comments
- Provides complete audit trail for visitor approvals

### 3. Division Head Approval Options
Division heads now have two approval methods:

#### Option A: Approve by Own Risk
- Division head takes full responsibility
- Visitor immediately approved for entry
- Status: `pending` → `approved`

#### Option B: Request Division Approval
- Sends request to division head for review
- Requires additional approval step
- Status: `pending` → `pending_division_approval` → `approved/declined`

## Workflow Diagram

```
Department User Submits Request
            ↓
        [PENDING]
            ↓
    Division Head Reviews
            ↓
    ┌─────────────────────┐
    ↓                     ↓
[APPROVE BY OWN RISK]  [REQUEST DIVISION APPROVAL]
    ↓                     ↓
[APPROVED]         [PENDING_DIVISION_APPROVAL]
    ↓                     ↓
Gate Check-in      Division Head Final Review
                          ↓
                   [APPROVED/DECLINED]
```

## API Endpoints

### New Approval Endpoints

#### 1. Initial Approval (Division Head)
```http
PATCH /api/visitors/requests/:id/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "approvalType": "own_risk" | "division_approval",
  "approvalComments": "Optional comments"
}
```

#### 2. Division Final Approval
```http
PATCH /api/visitors/requests/:id/division-approval
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "approved" | "declined",
  "approvalComments": "Required comments"
}
```

### Updated Response Fields

All visitor requests now include:
```json
{
  "approvalType": "own_risk" | "division_approval",
  "approvedBy": {
    "_id": "user_id",
    "fullName": "John Doe",
    "username": "john.doe",
    "department": "IT Department"
  },
  "approvedAt": "2024-01-15T10:30:00.000Z",
  "approvalComments": "Approved for system maintenance"
}
```

## Status Flow

| Status | Description | Who Can Action |
|--------|-------------|----------------|
| `pending` | Initial request submitted | Division Head |
| `pending_division_approval` | Awaiting division head approval | Division Head (same dept) |
| `approved` | Ready for gate entry | Gate Security |
| `declined` | Request rejected | - |
| `checked_in` | Visitor entered premises | Gate Security |
| `checked_out` | Visitor left premises | - |
| `expired` | Request expired | - |

## User Roles & Permissions

### Department User
- Submit visitor requests
- View own requests
- Cannot approve any requests

### Division Head
- View department requests
- Approve by own risk
- Request division approval
- Final approval for division requests

### Gate Security
- View approved visitors
- Check-in/check-out visitors
- Cannot approve requests

### Admin
- View all requests
- Access analytics
- Cannot approve requests (must be division head)

## Database Schema Changes

### VisitorRequest Model Updates
```javascript
{
  // New fields
  approvalType: {
    type: String,
    enum: ["own_risk", "division_approval"]
  },
  approvedBy: {
    type: ObjectId,
    ref: "User"
  },
  approvedAt: Date,
  approvalComments: String,
  
  // Updated status enum
  status: {
    enum: ["pending", "approved", "declined", "checked_in", 
           "checked_out", "expired", "pending_division_approval"]
  }
}
```

## Migration Notes

### For Existing Data
- Existing approved requests will not have `approvedBy` field
- Status remains compatible with existing values
- No data migration required

### For Frontend Updates
- Update approval buttons for division heads
- Add approval type selection
- Display approved by information
- Handle new `pending_division_approval` status

## Security Considerations

1. **Authorization**: Only division heads can approve requests
2. **Department Validation**: Division heads can only approve requests from their department
3. **Audit Trail**: Complete tracking of who approved what and when
4. **Role Verification**: System validates user role and department before allowing approval

## Testing Scenarios

### Test Case 1: Own Risk Approval
1. Division head selects "Approve by Own Risk"
2. Request status changes to "approved"
3. `approvedBy` field populated with division head info
4. Gate security can immediately check-in visitor

### Test Case 2: Division Approval Request
1. Division head selects "Request Division Approval"
2. Request status changes to "pending_division_approval"
3. Same department division head can approve/decline
4. Final approval populates `approvedBy` field

### Test Case 3: Cross-Department Restriction
1. Division head from Department A tries to approve Department B request
2. System returns 403 Forbidden error
3. Request remains unchanged