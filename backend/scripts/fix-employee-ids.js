const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function fixEmployeeIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find users with invalid employeeIds
    const invalidUsers = await User.find({
      $or: [
        { employeeId: { $regex: /NaN/ } },
        { employeeId: { $exists: false } },
        { employeeId: '' }
      ]
    });

    console.log(`Found ${invalidUsers.length} users with invalid employeeIds`);

    // Get the highest valid employeeId
    const latestUser = await User.findOne(
      { employeeId: { $regex: /^EMP\d{6}$/ } },
      {},
      { sort: { employeeId: -1 } }
    );

    let nextId = 1;
    if (latestUser && latestUser.employeeId) {
      const numericPart = latestUser.employeeId.replace('EMP', '');
      const currentId = parseInt(numericPart, 10);
      if (!isNaN(currentId)) {
        nextId = currentId + 1;
      }
    }

    // Fix each invalid user
    for (const user of invalidUsers) {
      const newEmployeeId = `EMP${String(nextId).padStart(6, '0')}`;
      await User.updateOne(
        { _id: user._id },
        { employeeId: newEmployeeId }
      );
      console.log(`Updated user ${user.username}: ${user.employeeId} -> ${newEmployeeId}`);
      nextId++;
    }

    console.log('✅ Employee IDs fixed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing employee IDs:', error);
    process.exit(1);
  }
}

fixEmployeeIds();