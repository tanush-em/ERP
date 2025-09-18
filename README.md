# College ERP System

A comprehensive Enterprise Resource Planning (ERP) system designed specifically for the CSE-AIML department. This system provides role-based access for administrators and students to manage various academic operations.

## 🌟 Features

### Core Functionality
- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Student Management**: Complete student lifecycle from enrollment to graduation
- **Course Management**: Course creation, enrollment, and administration
- **Attendance Tracking**: Digital attendance management with reporting
- **Assessment & Grading**: Score management and GPA calculation
- **Fee Management**: Fee collection and payment tracking
- **Timetable Management**: Schedule management for courses and rooms
- **Notification System**: System-wide notifications and alerts

### User Roles
- **Admin**: Full system access with management capabilities
- **Student**: Access to personal academic data and records

## 🛠️ Tech Stack

### Backend
- **Framework**: Flask 3.0.0 (Python)
- **Database**: MongoDB with PyMongo
- **Authentication**: Flask-JWT-Extended
- **Security**: bcrypt for password hashing
- **API**: RESTful API with comprehensive endpoints

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form
- **Icons**: Heroicons
- **Notifications**: React Hot Toast

## 📋 Prerequisites

- Python 3.8+
- Node.js 18+
- MongoDB (local or Atlas)
- Git

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ERP
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables (optional)
cp .env.example .env  # Edit with your MongoDB URI if needed

# Create sample data
python create_sample_data.py

# Run the backend server
python app.py
```

The backend server will start on `http://localhost:5000`

### 3. Frontend Setup
```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 🔐 Test Credentials

### Admin Access
- **Username**: `admin`
- **Password**: `admin123`

### Student Access
- **Username**: `student`
- **Password**: `student123`

Additional test students are available: `student1`, `student2`, etc. (all with password `student123`)

## 📊 Sample Data

The system includes comprehensive sample data:
- **30+ Students** with realistic academic profiles
- **13 Courses** across different semesters
- **Attendance Records** for the past 30 days
- **Academic Scores** for various assessments
- **Fee Records** with payment status
- **System Notifications** and alerts

## 🎯 Key Features Overview

### Student Portal
- **Dashboard**: Academic overview with GPA, attendance, and notifications
- **Course Management**: View enrolled courses and course details
- **Attendance Tracking**: View attendance records and percentages
- **Academic Records**: Access scores, grades, and transcripts
- **Fee Management**: View fee status and payment history
- **Timetable**: Personal class schedule
- **Notifications**: System announcements and alerts

### Admin Portal
- **Dashboard**: System overview with statistics and alerts
- **Student Management**: Add, edit, and manage student records
- **Course Management**: Create and manage courses
- **Attendance Management**: Mark attendance and generate reports
- **Score Management**: Add and manage student scores
- **Fee Management**: Create fee records and track payments
- **Notification System**: Send announcements to students
- **Reports & Analytics**: Various system reports and statistics

## 🔧 Development

### Project Structure
```
ERP/
├── backend/                 # Flask backend
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── middleware/         # Authentication middleware
│   ├── utils/              # Utility functions
│   └── create_sample_data.py
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js 14 app directory
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility libraries
│   │   └── types/         # TypeScript types
│   └── public/            # Static assets
└── README.md
```

### API Endpoints
- **Authentication**: `/api/auth/*`
- **Student Operations**: `/api/student/*`
- **Admin Operations**: `/api/admin/*`
- **Dashboard**: `/api/dashboard/*`
- **Common**: `/api/common/*`

## 🔒 Security Features

- JWT token-based authentication
- Role-based access control
- Password hashing with bcrypt
- Input validation and sanitization
- MongoDB injection protection
- CORS configuration
- Request rate limiting (recommended for production)

## 🚀 Production Deployment

### Backend Deployment
1. Set environment variables for production
2. Use a production MongoDB instance
3. Configure proper CORS origins
4. Use a production WSGI server (Gunicorn)
5. Set up proper logging and monitoring

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to platforms like Vercel, Netlify, or custom server
3. Configure environment variables
4. Set up proper domain and SSL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

## 🎉 Acknowledgments

- Built for educational purposes
- Designed for CSE-AIML department requirements
- Modern web technologies and best practices

---

**Happy Learning! 🎓**
