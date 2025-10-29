# Employee ID Generation Fix

## Issue Description

**Error**: `E11000 duplicate key error collection: Visitormanagement.users index: employeeId_1 dup key: { employeeId: "EMP000NaN" }`

**Root Cause**: The User model's pre-save hook was generating invalid employee IDs containing `NaN` due to improper numeric parsing, causing MongoDB duplicate key violations.

## Problem Analysis

### Original Problematic Code
```javascript
const currentId = parseInt(latestUser.employeeId.replace('EMP', ''));
nextId = currentId + 1; // Results in NaN + 1 = NaN
this.employeeId = `EMP${String(nextId).padStart(6, '0')}`; // "EMP000NaN"
```

### Issues Identified
1. **No validation** for `parseInt()` result
2. **No filtering** for valid employee ID formats in database query
3. **Inadequate fallback** handling for edge cases
4. **Missing NaN detection** in final employee ID assignment

## Solution Implemented

### 1. Enhanced Employee ID Generation Logic

```javascript
// Get the latest employee ID with proper numeric extraction
const latestUser = await this.constructor.findOne(
  { employeeId: { $regex: /^EMP\d{6}$/ } }, // Only valid formats
  {},
  { sort: { employeeId: -1 } }
);

let nextId = 1;
if (latestUser && latestUser.employeeId) {
  const numericPart = latestUser.employeeId.replace('EMP', '');
  const currentId = parseInt(numericPart, 10);
  if (!isNaN(currentId)) { // Validate before using
    nextId = currentId + 1;
  }
}

this.employeeId = `EMP${String(nextId).padStart(6, '0')}`;
```

### 2. Improved Fallback Mechanisms

```javascript
// Enhanced fallback with timestamp
catch (error) {
  this.employeeId = 'EMP' + Date.now().toString().slice(-6);
}

// Final safety check
if (!this.employeeId || this.employeeId === '' || this.employeeId.includes('NaN')) {
  this.employeeId = 'EMP' + Date.now().toString().slice(-6);
}
```

### 3. Database Cleanup Script

Created `scripts/fix-employee-ids.js` to clean existing invalid data:

```javascript
// Find users with invalid employeeIds
const invalidUsers = await User.find({
  $or: [
    { employeeId: { $regex: /NaN/ } },
    { employeeId: { $exists: false } },
    { employeeId: '' }
  ]
});

// Fix each invalid user with proper sequential IDs
for (const user of invalidUsers) {
  const newEmployeeId = `EMP${String(nextId).padStart(6, '0')}`;
  await User.updateOne({ _id: user._id }, { employeeId: newEmployeeId });
  nextId++;
}
```

## Execution Results

```bash
$ node scripts/fix-employee-ids.js
Connected to MongoDB
Found 1 users with invalid employeeIds
Updated user fira: EMP000NaN -> EMP000001
✅ Employee IDs fixed successfully
```

## Key Improvements

### Before Fix
- ❌ Generated `EMP000NaN` causing duplicate key errors
- ❌ No validation for numeric parsing
- ❌ Poor error handling
- ❌ Database queries included invalid formats

### After Fix
- ✅ Generates proper sequential IDs (`EMP000001`, `EMP000002`, etc.)
- ✅ Validates all numeric operations with `isNaN()` checks
- ✅ Robust fallback using timestamp-based IDs
- ✅ Filters database queries to only valid employee ID formats
- ✅ Prevents `NaN` in final employee ID assignment

## Prevention Measures

### 1. Input Validation
- Always validate `parseInt()` results with `isNaN()`
- Use regex filters for database queries
- Implement multiple fallback layers

### 2. Error Handling
- Graceful degradation with timestamp-based IDs
- Comprehensive logging for debugging
- Transaction safety for database operations

### 3. Testing Scenarios
- Empty database (first user)
- Corrupted employee IDs in database
- Network failures during ID generation
- Concurrent user creation

## Future Considerations

### 1. Atomic ID Generation
Consider using MongoDB's atomic operations for ID generation:
```javascript
const counter = await Counter.findOneAndUpdate(
  { _id: 'employeeId' },
  { $inc: { seq: 1 } },
  { new: true, upsert: true }
);
```

### 2. UUID Alternative
For high-concurrency scenarios, consider UUIDs:
```javascript
const { v4: uuidv4 } = require('uuid');
this.employeeId = `EMP-${uuidv4().slice(0, 8).toUpperCase()}`;
```

### 3. Database Constraints
Add additional database constraints to prevent invalid formats:
```javascript
employeeId: {
  type: String,
  unique: true,
  validate: {
    validator: (v) => /^EMP\d{6}$/.test(v),
    message: 'Employee ID must be in format EMP######'
  }
}
```

## Monitoring

### Health Checks
- Monitor for duplicate key errors in logs
- Validate employee ID format consistency
- Track ID generation performance

### Alerts
- Set up alerts for employee ID generation failures
- Monitor database constraint violations
- Track unusual ID patterns

---

**Status**: ✅ **RESOLVED**  
**Impact**: No more duplicate key errors, proper sequential employee ID generation  
**Verification**: All existing invalid employee IDs cleaned up, new users generate proper IDs