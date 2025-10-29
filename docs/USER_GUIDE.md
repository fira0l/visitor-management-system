# User Guide - New Approval System

## For Division Heads

### Approving Visitor Requests

When you receive a visitor request, you have two approval options:

#### Option 1: Approve by Own Risk
- **When to use**: When you're confident about the visitor and want immediate approval
- **Responsibility**: You take full responsibility for the visitor
- **Result**: Visitor is immediately approved and can enter premises

**Steps**:
1. Review visitor details carefully
2. Select "Approve by Own Risk"
3. Add optional comments
4. Click "Approve"
5. Visitor status changes to "Approved"

#### Option 2: Request Division Approval
- **When to use**: When you need additional oversight or approval
- **Process**: Sends request to division head for final decision
- **Result**: Request goes to "Pending Division Approval" status

**Steps**:
1. Review visitor details
2. Select "Request Division Approval"
3. Add comments explaining why additional approval is needed
4. Click "Submit for Approval"
5. Division head will receive notification for final approval

### Managing Division Approval Requests

As a division head, you'll see requests marked "Pending Division Approval":

**Steps**:
1. Review original request and comments
2. Check visitor details and purpose
3. Choose "Approve" or "Decline"
4. Add approval/decline comments
5. Submit decision

## For Department Users

### Submitting Requests
The request submission process remains the same:

1. Fill out visitor information
2. Set visit date and time
3. Specify purpose and items
4. Submit request
5. **New**: Request goes to your division head (not security)

### Tracking Your Requests
You can now see:
- Who approved your request
- When it was approved
- Approval comments
- Approval type (own risk vs division approval)

## For Gate Security

### Check-in Process
Only approved visitors can be checked in:

1. Scan/search for visitor by approval code
2. Verify visitor identity
3. Check items brought vs. declared items
4. Complete check-in
5. **New**: See who approved the visitor in the details

### Visitor Information
You now have access to:
- Approved by: Which division head approved
- Approval type: Own risk or division approval
- Approval comments: Any special instructions

## For Administrators

### Analytics Dashboard
New metrics available:
- Pending Division Approval count
- Approval type breakdown (own risk vs division)
- Division head approval activity
- Department-wise approval patterns

### Audit Trail
Complete tracking of:
- Who requested the visitor
- Who approved the visitor
- When approval was given
- Approval method used
- All comments and decisions

## Status Meanings

| Status | What It Means | Next Action |
|--------|---------------|-------------|
| **Pending** | Waiting for division head review | Division head to approve |
| **Pending Division Approval** | Awaiting final division approval | Division head final decision |
| **Approved** | Ready for gate entry | Gate security check-in |
| **Declined** | Request rejected | None (can resubmit new request) |
| **Checked In** | Visitor on premises | Gate security check-out |
| **Checked Out** | Visit completed | None |

## Best Practices

### For Division Heads
1. **Review Thoroughly**: Check visitor purpose and items
2. **Use Own Risk Wisely**: Only for trusted/routine visits
3. **Document Decisions**: Always add meaningful comments
4. **Timely Approval**: Process requests promptly to avoid delays

### For Department Users
1. **Complete Information**: Provide all required visitor details
2. **Advance Planning**: Submit requests with adequate lead time
3. **Clear Purpose**: Specify detailed visit purpose
4. **Item Accuracy**: List all items visitor will bring

### For Gate Security
1. **Verify Identity**: Always check visitor ID against request
2. **Item Verification**: Compare actual items with approved list
3. **Note Discrepancies**: Report any differences to division head
4. **Timely Check-out**: Ensure visitors are checked out when leaving

## Troubleshooting

### Common Issues

**"Only division heads can approve requests"**
- Solution: Ensure user has division_head role in departmentRole field

**"Request is not pending division approval"**
- Solution: Check request status - it may already be processed

**"Only division head of the same department can approve"**
- Solution: Verify division head is from the same department as request

### Getting Help
Contact system administrator if:
- Role assignments need updating
- Department assignments are incorrect
- System errors persist
- Additional training needed