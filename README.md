# INSA Visitor Management System

A comprehensive MERN stack application for managing visitors in an organization like INSA. The system provides role-based access control and a complete visitor workflow from request to approval to entry/exit.

## 🏗️ Project Structure

\`\`\`
visitor-management-system/
├── backend/                 # Node.js + Express + MongoDB
│   ├── config/             # Database and app configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Authentication & authorization
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── scripts/           # Database seeding scripts
│   ├── utils/             # Utility functions
│   ├── .env               # Environment variables
│   ├── package.json       # Backend dependencies
│   └── server.js          # Express server entry point
├── frontend/               # React + TypeScript
│   ├── public/            # Static files
│   ├── src/               # React source code
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utility functions
│   │   ├── App.tsx        # Main App component
│   │   └── index.tsx      # React entry point
│   ├── package.json       # Frontend dependencies
│   └── tailwind.config.js # Tailwind configuration
├── package.json           # Root package.json for scripts
└── README.md             # Project documentation
\`\`\`

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
\`\`\`bash
git clone <repository-url>
cd visitor-management-system
\`\`\`

2. **Install all dependencies**
\`\`\`bash
npm run install-all
\`\`\`

3. **Set up environment variables**

Backend (.env in backend folder):
\`\`\`env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/visitor-management
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
\`\`\`

Frontend (.env in frontend folder):
\`\`\`env
REACT_APP_API_URL=http://localhost:5000/api
\`\`\`

4. **Seed the database**
\`\`\`bash
npm run seed
\`\`\`

5. **Start the development servers**
\`\`\`bash
npm run dev
\`\`\`

This will start both backend (port 5000) and frontend (port 3000) servers concurrently.

## 🔐 Demo Credentials

After seeding the database:

- **Admin**: `admin` / `admin123`
- **Department User**: `dept_user` / `dept123`
- **Security**: `security` / `security123`
- **Gate**: `gate` / `gate123`

## 📋 Features

### 👥 User Roles & Permissions

**Admin**
- View all visitor requests and reports across departments
- Access comprehensive analytics dashboard
- Filter and export logs by department, date, visitor name, or status

**Department Head/Employee**
- Submit visitor details (name, ID, purpose, items brought)
- Set visit duration (hours or days)
- Track their submitted requests

**Security Team**
- Review pending visitor requests
- Approve or decline requests with comments
- View request history

**Front Gate Security**
- View approved visitor details
- Check-in visitors with actual items verification
- Check-out visitors with timestamp tracking
- Real-time visitor status management

### 🔄 Visitor Request Workflow

1. **Request Submission**: Department user submits visitor details
2. **Security Review**: Security team reviews and approves/declines
3. **Gate Management**: Front gate security handles check-in/check-out
4. **Tracking**: Complete audit trail with timestamps

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** for cross-origin requests

### Frontend
- **React.js** with TypeScript
- **React Router** for navigation
- **Axios** for API calls
- **Tailwind CSS** for styling
- **Heroicons** for icons
- **React Hot Toast** for notifications

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Visitor Management Endpoints
- `POST /api/visitors/request` - Create visitor request
- `GET /api/visitors/requests` - Get visitor requests (role-based)
- `PATCH /api/visitors/requests/:id/review` - Review request (security)
- `POST /api/visitors/checkin/:id` - Check-in visitor (gate)
- `PATCH /api/visitors/checkout/:id` - Check-out visitor (gate)
- `GET /api/visitors/analytics` - Get analytics (admin)

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Build and deploy to your preferred platform (Heroku, AWS, etc.)
3. Ensure MongoDB connection is configured

### Frontend Deployment
1. Update API URL in environment variables
2. Build the React app: `cd frontend && npm run build`
3. Deploy build folder to static hosting (Netlify, Vercel, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
