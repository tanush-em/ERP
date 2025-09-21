# College ERP System - Admin Only

A comprehensive Enterprise Resource Planning (ERP) system designed specifically for college administrators. This system provides complete administrative control over student management, course administration, attendance tracking, fee management, and more.

## 🌟 Features

### Admin-Only Functionality
- **Student Management**: Complete student lifecycle from enrollment to graduation
- **Course Management**: Course creation, enrollment, and administration
- **Attendance Management**: Digital attendance tracking with comprehensive reporting
- **Assessment & Grading**: Score management and GPA calculation
- **Fee Management**: Fee collection, payment tracking, and financial reporting
- **Timetable Management**: Schedule management for courses and rooms
- **Notification System**: System-wide notifications and announcements
- **Dashboard Analytics**: Comprehensive statistics and insights
- **System Settings**: Configuration and administrative controls

### Key Admin Capabilities
- **Student Operations**: Add, edit, delete, and manage student records
- **Course Administration**: Create courses, manage enrollments, track progress
- **Attendance Control**: Mark attendance, generate reports, monitor patterns
- **Grade Management**: Add scores, calculate GPAs, generate transcripts
- **Financial Oversight**: Track fees, record payments, manage overdue accounts
- **Communication**: Send notifications and announcements to students
- **Data Analytics**: View comprehensive dashboards and generate reports

## 🛠️ Tech Stack

### Backend
- **Framework**: Flask 3.0.0 (Python)
- **Database**: MongoDB with PyMongo
- **API**: RESTful API with comprehensive admin endpoints

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Modern React patterns
- **UI Components**: Custom component library

## 📋 Prerequisites

- Python 3.8+
- Node.js 18+
- MongoDB (local or Atlas)
- Git

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd myERP
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

# Run the application
python app.py
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Quick Start
```bash
# Use the provided start script
./start.sh  # On Unix/Mac
start.bat   # On Windows
```

## 🎯 Admin Dashboard

The admin dashboard provides:

- **Overview Statistics**: Total students, courses, pending fees, overdue payments
- **Semester Distribution**: Visual representation of student enrollment by semester
- **Quick Actions**: Direct access to common administrative tasks
- **System Health**: Real-time system status and performance metrics

## 📊 Admin Features

### Student Management
- View all students with pagination and search
- Add new students with complete profile information
- Edit student details and academic information
- Manage student status (active/inactive)
- Generate student reports and analytics

### Course Management
- Create and manage course catalog
- Set course details (code, name, credits, semester)
- Manage course enrollments
- Track course capacity and enrollment statistics

### Attendance Management
- Mark attendance for classes
- View attendance records by course, student, or date
- Generate attendance reports
- Monitor attendance patterns and trends

### Grade Management
- Add scores for different exam types
- Calculate GPAs automatically
- Generate transcripts
- Track academic performance

### Fee Management
- Create fee records for students
- Track payment status
- Record payments and transactions
- Generate financial reports
- Manage overdue accounts

### Timetable Management
- Create class schedules
- Manage room assignments
- Avoid scheduling conflicts
- Generate timetable reports

### Notifications
- Send announcements to all students
- Create targeted notifications
- Track notification delivery
- Manage communication history

## 🔧 API Endpoints

All API endpoints are admin-focused:

- **Students**: `/api/admin/students/*`
- **Courses**: `/api/admin/courses/*`
- **Attendance**: `/api/admin/attendance/*`
- **Scores**: `/api/admin/scores/*`
- **Fees**: `/api/admin/fees/*`
- **Timetable**: `/api/admin/timetable/*`
- **Notifications**: `/api/admin/notifications/*`
- **Dashboard**: `/api/admin/dashboard/*`

## 🔒 Security

- Input validation and sanitization
- MongoDB injection protection
- CORS configuration
- Error handling and logging

## 🚀 Production Deployment

### Backend
1. Set environment variables for production
2. Use a production MongoDB instance
3. Configure proper CORS origins
4. Use a production WSGI server (Gunicorn)

### Frontend
1. Build the application: `npm run build`
2. Deploy to platforms like Vercel, Netlify, or custom server
3. Configure environment variables
4. Set up proper domain and SSL

## 📝 Usage

1. Access the application at `http://localhost:3000`
2. The system automatically redirects to the admin dashboard
3. Use the sidebar navigation to access different admin features
4. All functionality is designed for administrative use

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Note**: This is an admin-only system. All student-facing features have been removed to focus exclusively on administrative functionality.
