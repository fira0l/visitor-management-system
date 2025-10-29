const fs = require('fs');
const path = require('path');

// Backend .env content
const backendEnv = `NODE_ENV=development
PORT=5000
MONGODB_URI="mongodb+srv://fira0l_db_user:talent%40123@talent.inescye.mongodb.net/Visitormanagement?retryWrites=true&w=majority&appName=Talent"
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random-123456789
JWT_EXPIRE=24h
BCRYPT_ROUNDS=12
`;

// Frontend .env content
const frontendEnv = `REACT_APP_API_URL=http://localhost:5000/api
`;

// Create backend .env
const backendEnvPath = path.join(__dirname, 'backend', '.env');
if (!fs.existsSync(backendEnvPath)) {
  fs.writeFileSync(backendEnvPath, backendEnv);
  console.log('✅ Created backend/.env');
} else {
  console.log('ℹ️  backend/.env already exists');
}

// Create frontend .env
const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
if (!fs.existsSync(frontendEnvPath)) {
  fs.writeFileSync(frontendEnvPath, frontendEnv);
  console.log('✅ Created frontend/.env');
} else {
  console.log('ℹ️  frontend/.env already exists');
}

console.log('\n🎉 Environment setup complete!');
console.log('\nNext steps:');
console.log('1. Make sure MongoDB is running');
console.log('2. Run: npm run seed');
console.log('3. Run: npm run dev');
console.log('\nDemo credentials:');
console.log('Admin: admin / admin123');
console.log('Department User: dept_user / dept123');
console.log('Security: security / security123');
console.log('Gate: gate / gate123');
