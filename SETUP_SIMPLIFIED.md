# Simplified Student ERP System

This ERP system has been simplified to remove all authentication and admin features. It now only contains student-focused functionality.

## What's Changed

### Removed Features
- ✅ Authentication system (login/logout)
- ✅ Admin dashboard and management features
- ✅ User roles and permissions
- ✅ JWT tokens and session management
- ✅ Password hashing and verification
- ✅ Admin routes and middleware

### Remaining Features
- ✅ Student dashboard
- ✅ Course viewing
- ✅ Attendance tracking
- ✅ Score/grades viewing
- ✅ Fee information
- ✅ Notifications
- ✅ Timetable viewing
- ✅ Student profile

## How to Run

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Usage

1. The system will automatically redirect to the student dashboard
2. All student features are accessible through the sidebar
3. The student ID is currently hardcoded in the dashboard (for demo purposes)
4. All API endpoints now require a `studentId` parameter instead of using JWT authentication

## API Changes

### Before (with authentication)
```javascript
// Required JWT token in headers
GET /api/student/courses
```

### After (simplified)
```javascript
// Requires studentId parameter
GET /api/student/courses?studentId=67890abcdef123456789012
```

## Database Structure

The system now uses:
- `students` collection (renamed from `users`)
- All other collections remain the same
- Removed authentication-related fields

## Development Notes

- The frontend uses a hardcoded student ID for demonstration
- In a real implementation, you might want to add a student selector or URL-based routing
- All authentication dependencies have been removed from both frontend and backend
- The system is now much simpler and focused on student functionality only

