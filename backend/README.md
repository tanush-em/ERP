# College ERP Backend

A comprehensive Flask-based backend system for managing college operations including student management, course administration, attendance tracking, and more.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Student Management**: Complete student lifecycle management
- **Course Management**: Course creation, enrollment, and administration
- **Attendance System**: Attendance tracking and reporting
- **Assessment & Scoring**: Grade management and GPA calculation
- **Fee Management**: Fee collection and payment tracking
- **Timetable Management**: Schedule management for courses and rooms
- **Notification System**: System-wide notifications and alerts

## Tech Stack

- **Framework**: Flask 3.0.0
- **Database**: MongoDB with PyMongo
- **Authentication**: Flask-JWT-Extended
- **Password Hashing**: bcrypt
- **CORS**: Flask-CORS

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ERP/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Create a database named `college_erp`

5. **Environment Variables**
   Create a `.env` file in the backend directory:
   ```env
   SECRET_KEY=your-secret-key-here
   JWT_SECRET_KEY=your-jwt-secret-key-here
   MONGO_URI=mongodb://localhost:27017/college_erp
   DEBUG=True
   ```

6. **Initialize Database**
   ```bash
   python create_sample_data.py
   ```

7. **Run the application**
   ```bash
   python app.py
   ```

The backend server will start on `http://localhost:5000`

## API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - User logout

### Student Endpoints

- `GET /api/student/courses` - Get student courses
- `GET /api/student/timetable` - Get student timetable
- `GET /api/student/attendance` - Get attendance records
- `GET /api/student/scores` - Get academic scores
- `GET /api/student/gpa` - Get GPA information
- `GET /api/student/transcript` - Get academic transcript
- `GET /api/student/fees` - Get fee records
- `GET /api/student/notifications` - Get notifications

### Admin Endpoints

- `GET /api/admin/students` - Get all students
- `POST /api/admin/students` - Create new student
- `PUT /api/admin/students/:id` - Update student
- `DELETE /api/admin/students/:id` - Deactivate student
- `GET /api/admin/courses` - Get all courses
- `POST /api/admin/courses` - Create new course
- `POST /api/admin/enrollments` - Bulk enroll students
- `POST /api/admin/attendance` - Mark attendance
- `POST /api/admin/scores` - Add scores
- `POST /api/admin/fees` - Create fee records
- `POST /api/admin/notifications/broadcast` - Send notifications

### Dashboard Endpoints

- `GET /api/dashboard/student` - Student dashboard data
- `GET /api/dashboard/admin` - Admin dashboard data
- `GET /api/dashboard/quick-stats` - Quick statistics
- `GET /api/dashboard/recent-activities` - Recent activities

### Common Endpoints

- `GET /api/common/courses` - Get courses (public)
- `GET /api/common/timetable` - Get timetable information
- `GET /api/common/search` - Global search
- `GET /api/common/health` - Health check

## Database Schema

### Collections

1. **users** - Admin and student user accounts
2. **courses** - Course information
3. **enrollments** - Student-course enrollments
4. **attendance** - Attendance records
5. **scores** - Academic scores and grades
6. **timetables** - Class schedules
7. **fees** - Fee records and payments
8. **notifications** - System notifications

## Sample Data

The system includes comprehensive sample data:

- **Admin User**: username: `admin`, password: `admin123`
- **Test Student**: username: `student`, password: `student123`
- **30 Sample Students** with realistic data
- **13 Courses** across different semesters
- **Attendance Records** for the past 30 days
- **Academic Scores** for various assessments
- **Fee Records** with payment status
- **System Notifications**

## Security Features

- Password hashing using bcrypt
- JWT token-based authentication
- Role-based access control
- Request data validation
- MongoDB injection protection
- CORS configuration

## Error Handling

The API includes comprehensive error handling:
- Input validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Resource not found errors (404)
- Internal server errors (500)

## Development

### Project Structure
```
backend/
├── app.py                 # Main Flask application
├── config.py             # Configuration settings
├── models/               # Database models
├── routes/              # API routes
├── middleware/          # Middleware functions
├── utils/               # Utility functions
├── create_sample_data.py # Sample data creation
└── requirements.txt     # Python dependencies
```

### Adding New Features

1. Create model in `models/` directory
2. Add routes in `routes/` directory
3. Register blueprint in `app.py`
4. Add middleware if needed
5. Update sample data script if required

## Testing

Run the health check endpoint to verify the system:
```bash
curl http://localhost:5000/api/common/health
```

## Production Deployment

1. Set `DEBUG=False` in environment variables
2. Use production MongoDB instance
3. Set strong secret keys
4. Configure proper CORS origins
5. Use HTTPS in production
6. Set up proper logging
7. Use a production WSGI server like Gunicorn

## Support

For issues and questions, please refer to the project documentation or create an issue in the repository.
