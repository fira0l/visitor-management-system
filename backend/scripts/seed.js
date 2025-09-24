const mongoose = require("mongoose")
const User = require("../models/User")
const VisitorRequest = require("../models/VisitorRequest")
require("dotenv").config()

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("✅ Connected to MongoDB")

    // Clear existing data
    await User.deleteMany({})
    await VisitorRequest.deleteMany({})
    console.log("🗑️  Cleared existing data")

    // Create users individually to ensure password hashing works
    const userData = [
      {
        username: "admin",
        email: "admin@insa.com",
        password: "admin123",
        role: "admin",
        fullName: "System Administrator",
        location: "Wollo Sefer",
        isApproved: true,
      },
      {
        username: "dept_user",
        email: "dept@insa.com",
        password: "dept123",
        role: "department_user",
        department: "Computer Science",
        departmentType: "division",
        departmentRole: "division_head",
        fullName: "John Department",
        location: "Wollo Sefer",
        isApproved: true,
      },
      {
        username: "security",
        email: "security@insa.com",
        password: "security123",
        role: "security",
        fullName: "Security Officer",
        location: "Wollo Sefer",
        isApproved: true,
      },
      {
        username: "gate",
        email: "gate@insa.com",
        password: "gate123",
        role: "gate",
        fullName: "Gate Security",
        location: "Wollo Sefer",
        isApproved: true,
      },
    ]

    const createdUsers = []
    for (const userDataItem of userData) {
      const user = await User.create(userDataItem)
      createdUsers.push(user)
    }
    console.log(`👥 Created ${createdUsers.length} users`)

    // Create sample visitor requests
    const deptUser = createdUsers.find((u) => u.role === "department_user")

    const visitorRequests = [
      {
        visitorName: "Alice Johnson",
        visitorId: "ID123456",
        nationalId: "NAT123456789",
        visitorPhone: "+1234567890",
        visitorEmail: "alice@example.com",
        purpose: "Technical presentation and project discussion",
        itemsBrought: ["Laptop", "Presentation materials"],
        department: "Computer Science",
        departmentType: "division",
        location: "Wollo Sefer",
        requestedBy: deptUser._id,
        visitDuration: { hours: 3, days: 0 },
        scheduledDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
        scheduledTime: "10:00",
        status: "pending",
      },
      {
        visitorName: "Bob Smith",
        visitorId: "ID789012",
        nationalId: "NAT987654321",
        visitorPhone: "+1987654321",
        purpose: "Research collaboration meeting",
        itemsBrought: ["Documents", "USB Drive"],
        department: "Computer Science",
        departmentType: "division",
        location: "Wollo Sefer",
        requestedBy: deptUser._id,
        visitDuration: { hours: 2, days: 0 },
        scheduledDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
        scheduledTime: "14:00",
        status: "approved",
      },
      {
        visitorName: "Carol Davis",
        visitorId: "ID345678",
        nationalId: "NAT345678901",
        visitorPhone: "+1122334455",
        visitorEmail: "carol@company.com",
        purpose: "Industry partnership discussion",
        itemsBrought: ["Laptop", "Contract documents"],
        department: "Computer Science",
        departmentType: "division",
        location: "Wollo Sefer",
        requestedBy: deptUser._id,
        visitDuration: { hours: 4, days: 0 },
        scheduledDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
        scheduledTime: "09:00",
        status: "checked_out",
      },
    ]

    await VisitorRequest.insertMany(visitorRequests)
    console.log(`📋 Created ${visitorRequests.length} visitor requests`)

    console.log("\n🎉 SEED DATA CREATED SUCCESSFULLY!")
    console.log("\n🔐 Demo Login Credentials:")
    console.log("Admin: admin / admin123")
    console.log("Department User: dept_user / dept123")
    console.log("Security: security / security123")
    console.log("Gate: gate / gate123")

    process.exit(0)
  } catch (error) {
    console.error("❌ Error seeding data:", error)
    process.exit(1)
  }
}

seedData()
