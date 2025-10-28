# AWAKE Connect - MySQL Version

A student sponsorship platform connecting donors with Pakistani students seeking educational funding, built with React, Node.js, and MySQL.

## 🎯 Overview

AWAKE Connect is a comprehensive platform that facilitates educational sponsorships by connecting generous donors with deserving students. This MySQL version provides the same functionality as the original PostgreSQL/Prisma version but uses MySQL with Sequelize ORM.

## 🏗️ Architecture

### Frontend
- **React 18** with Vite for fast development
- **Tailwind CSS** for styling
- **shadcn/ui** components for consistent UI
- **React Router** for navigation
- **Axios** for API communication

### Backend
- **Node.js** with Express.js
- **MySQL** database
- **Sequelize** ORM for database operations
- **JWT** authentication
- **bcryptjs** for password hashing
- **Joi** for request validation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### 1. Clone & Install

```bash
# Navigate to the project
cd donors-mysql

# Install all dependencies
npm run install:all
```

### 2. Database Setup

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE awake_connect;
exit
```

### 3. Environment Configuration

```bash
# Backend environment
cd backend
cp .env.example .env

# Edit .env with your settings:
# DB_NAME=awake_connect
# DB_USER=root
# DB_PASSWORD=your_password
# JWT_SECRET=your-secret-key
```

### 4. Start Development

```bash
# From root directory - starts both frontend and backend
npm run dev

# Or start individually:
npm run dev:backend  # Backend on http://localhost:3001
npm run dev:frontend # Frontend on http://localhost:5173
```

## 📁 Project Structure

```
donors-mysql/
├── backend/
│   ├── src/
│   │   ├── config/         # Database & environment config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helper functions
│   ├── uploads/            # File uploads
│   ├── package.json
│   └── server.js           # Server entry point
├── frontend/
│   ├── src/
│   │   ├── api/            # API client & endpoints
│   │   ├── components/     # React components
│   │   ├── lib/            # Utilities & context
│   │   ├── pages/          # Page components
│   │   └── main.jsx        # App entry point
│   ├── public/
│   └── package.json
└── package.json            # Root package file
```

## 🔐 Authentication & Roles

### User Roles
- **STUDENT**: Can create applications and manage profile
- **DONOR**: Can browse students and make sponsorships  
- **ADMIN**: Full platform management access
- **SUB_ADMIN**: Limited administrative access
- **FIELD_OFFICER**: Student verification and review

### Demo Accounts
Access the platform with these demo credentials:

```
Student: student@demo.com / demo123
Donor: donor@demo.com / demo123
```

## 🗃️ Database Schema

### Core Models
- **Users**: Authentication and role management
- **Students**: Student profiles and academic information
- **Donors**: Donor profiles and preferences
- **Applications**: Funding applications from students
- **Sponsorships**: Donor-student funding relationships
- **Documents**: File uploads and document management

### Key Features
- Foreign key relationships between all models
- Automatic timestamps (createdAt, updatedAt)
- Data validation at model level
- Enum types for status fields
- UUID primary keys for security

## 🛠️ API Endpoints

### Authentication
```
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
GET  /api/auth/profile     # Get user profile
POST /api/auth/change-password # Change password
```

### Students
```
GET    /api/students       # List students
GET    /api/students/:id   # Get student details
POST   /api/students       # Create student
PUT    /api/students/:id   # Update student
DELETE /api/students/:id   # Delete student
```

### Applications
```
GET    /api/applications   # List applications
GET    /api/applications/:id # Get application
POST   /api/applications   # Create application
PUT    /api/applications/:id # Update application
```

### Donors & Sponsorships
```
GET    /api/donors         # List donors
GET    /api/sponsorships   # List sponsorships
POST   /api/sponsorships   # Create sponsorship
```

## 🎨 UI Components

Built with shadcn/ui for consistent, accessible design:

- **Cards**: Content containers
- **Buttons**: Various styles and states
- **Forms**: Input fields with validation
- **Navigation**: Headers and routing
- **Modals**: Overlays and dialogs

## 🔧 Development

### Available Scripts

```bash
# Root level
npm run dev              # Start both frontend and backend
npm run install:all      # Install all dependencies

# Backend
npm run dev              # Start with nodemon
npm run start            # Production start
npm test                 # Run tests

# Frontend  
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build
```

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=awake_connect
DB_USER=root
DB_PASSWORD=
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

#### Frontend (Optional .env)
```env
VITE_API_URL=http://localhost:3001/api
```

## 🚀 Production Deployment

### Database Migration
```bash
# The app automatically syncs database schema
# For production, use migrations:
# npm run migrate:up
```

### Build & Deploy
```bash
# Build frontend
cd frontend && npm run build

# Start production server
cd backend && npm start
```

### Environment Setup
- Set NODE_ENV=production
- Use strong JWT_SECRET
- Configure MySQL with proper credentials
- Set up HTTPS and domain
- Configure CORS for your domain

## 📊 Key Features

### For Students
- ✅ Complete profile management
- ✅ Application submission and tracking
- ✅ Document upload system
- ✅ Progress reporting
- ✅ Communication with donors

### For Donors  
- ✅ Student marketplace browsing
- ✅ Sponsorship management
- ✅ Payment integration ready
- ✅ Impact tracking
- ✅ Secure transactions

### For Administrators
- ✅ Application review and approval
- ✅ User management
- ✅ Platform analytics
- ✅ Content moderation
- ✅ System monitoring

## 🛡️ Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation with Joi
- SQL injection prevention via Sequelize
- Rate limiting
- CORS protection
- Helmet security headers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For questions or issues:
1. Check the documentation
2. Search existing issues
3. Create a new issue with details
4. Contact the development team

---

**Built with ❤️ for education and opportunity**