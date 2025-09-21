from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from models.student import Student
from models.course import Course
from models.enrollment import Enrollment
from models.attendance import Attendance
from models.score import Score
from models.timetable import Timetable
from models.fee import Fee
from models.notification import Notification
from utils.helpers import get_semester_from_date, get_academic_year
from bson import ObjectId

admin_bp = Blueprint('admin', __name__)

# Student Management Routes
@admin_bp.route('/students', methods=['GET'])
def get_all_students():
    """Get all students with pagination and filtering"""
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    search = request.args.get('search', '')
    semester = request.args.get('semester', '')
    
    student_model = Student()
    
    if search or semester:
        # Add filtering logic here if needed
        students = student_model.get_all_students(page, limit)
    else:
        students = student_model.get_all_students(page, limit)
    
    return jsonify(students), 200

@admin_bp.route('/students', methods=['POST'])
def create_student():
    """Create a new student"""
    data = request.get_json()
    
    required_fields = ['email', 'firstName', 'lastName', 'rollNumber']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'error': f'Missing required field: {field}'
            }), 400
    
    student_model = Student()
    
    # Check if email already exists
    existing_student = student_model.find_by_email(data['email'])
    if existing_student:
        return jsonify({
            'error': 'Student with this email already exists'
        }), 400
    
    # Check if roll number already exists
    existing_roll = student_model.find_by_roll_number(data['rollNumber'])
    if existing_roll:
        return jsonify({
            'error': 'Student with this roll number already exists'
        }), 400
    
    # Structure the student data
    student_data = {
        'email': data['email'],
        'role': 'student',
        'profile': {
            'firstName': data['firstName'],
            'lastName': data['lastName'],
            'rollNumber': data['rollNumber'],
            'semester': data.get('semester', 1),
            'department': data.get('department', ''),
            'dateOfBirth': data.get('dateOfBirth'),
            'phoneNumber': data.get('phoneNumber', ''),
            'address': data.get('address', ''),
            'guardianName': data.get('guardianName', ''),
            'guardianPhone': data.get('guardianPhone', '')
        }
    }
    
    student_id = student_model.create_student(student_data)
    
    return jsonify({
        'message': 'Student created successfully',
        'studentId': student_id
    }), 201

@admin_bp.route('/students/<student_id>', methods=['GET'])
def get_student_by_id(student_id):
    """Get student details by ID"""
    student_model = Student()
    student = student_model.find_by_id(student_id)
    
    if not student:
        return jsonify({
            'error': 'Student not found'
        }), 404
    
    return jsonify({'student': student}), 200

@admin_bp.route('/students/<student_id>', methods=['PUT'])
def update_student(student_id):
    """Update student information"""
    data = request.get_json()
    student_model = Student()
    
    # Check if student exists
    existing_student = student_model.find_by_id(student_id)
    if not existing_student:
        return jsonify({
            'error': 'Student not found'
        }), 404
    
    success = student_model.update_student(student_id, data)
    
    if success:
        return jsonify({
            'message': 'Student updated successfully'
        }), 200
    else:
        return jsonify({
            'error': 'Failed to update student'
        }), 500

@admin_bp.route('/students/<student_id>', methods=['DELETE'])
def delete_student(student_id):
    """Delete (deactivate) student"""
    student_model = Student()
    
    success = student_model.deactivate_student(student_id)
    
    if success:
        return jsonify({
            'message': 'Student deleted successfully'
        }), 200
    else:
        return jsonify({
            'error': 'Failed to delete student'
        }), 500

# Course Management Routes
@admin_bp.route('/courses', methods=['GET'])
def get_all_courses():
    """Get all courses"""
    course_model = Course()
    courses = course_model.get_all_courses()
    
    return jsonify({'courses': courses}), 200

@admin_bp.route('/courses', methods=['POST'])
def create_course():
    """Create a new course"""
    data = request.get_json()
    
    required_fields = ['courseCode', 'courseName', 'credits', 'semester']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'error': f'Missing required field: {field}'
            }), 400
    
    course_model = Course()
    course_id = course_model.create_course(data)
    
    return jsonify({
        'message': 'Course created successfully',
        'courseId': course_id
    }), 201

@admin_bp.route('/courses/<course_id>', methods=['PUT'])
def update_course(course_id):
    """Update course information"""
    data = request.get_json()
    course_model = Course()
    
    success = course_model.update_course(course_id, data)
    
    if success:
        return jsonify({
            'message': 'Course updated successfully'
        }), 200
    else:
        return jsonify({
            'error': 'Failed to update course'
        }), 500

@admin_bp.route('/courses/<course_id>', methods=['DELETE'])
def delete_course(course_id):
    """Delete course"""
    course_model = Course()
    success = course_model.delete_course(course_id)
    
    if success:
        return jsonify({
            'message': 'Course deleted successfully'
        }), 200
    else:
        return jsonify({
            'error': 'Failed to delete course'
        }), 500

# Enrollment Management
@admin_bp.route('/enrollments', methods=['GET'])
def get_enrollments():
    """Get all enrollments"""
    enrollment_model = Enrollment()
    enrollments = enrollment_model.get_all_enrollments()
    
    return jsonify({'enrollments': enrollments}), 200

@admin_bp.route('/enrollments', methods=['POST'])
def create_enrollment():
    """Enroll student in course"""
    data = request.get_json()
    
    required_fields = ['studentId', 'courseId', 'semester']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'error': f'Missing required field: {field}'
            }), 400
    
    enrollment_model = Enrollment()
    enrollment_id = enrollment_model.enroll_student(
        data['studentId'], 
        data['courseId'], 
        data['semester']
    )
    
    return jsonify({
        'message': 'Student enrolled successfully',
        'enrollmentId': enrollment_id
    }), 201

# Attendance Management
@admin_bp.route('/attendance', methods=['GET'])
def get_attendance_records():
    """Get attendance records with filtering"""
    course_id = request.args.get('courseId')
    student_id = request.args.get('studentId')
    date_str = request.args.get('date')
    
    attendance_model = Attendance()
    
    date_filter = None
    if date_str:
        date_filter = datetime.fromisoformat(date_str.replace('Z', '+00:00')).date()
    
    records = attendance_model.get_attendance_records(course_id, student_id, date_filter)
    
    return jsonify({
        'attendance': records,
        'total': len(records)
    }), 200

@admin_bp.route('/attendance', methods=['POST'])
def mark_attendance():
    """Mark attendance for students"""
    data = request.get_json()
    
    required_fields = ['courseId', 'date', 'attendanceRecords']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'error': f'Missing required field: {field}'
            }), 400
    
    attendance_model = Attendance()
    
    success_count = 0
    for record in data['attendanceRecords']:
        success = attendance_model.mark_attendance(
            record['studentId'],
            data['courseId'],
            data['date'],
            record['status']
        )
        if success:
            success_count += 1
    
    return jsonify({
        'message': f'Attendance marked for {success_count} students',
        'successCount': success_count
    }), 200

# Score Management
@admin_bp.route('/scores', methods=['GET'])
def get_scores():
    """Get scores with filtering"""
    course_id = request.args.get('courseId')
    student_id = request.args.get('studentId')
    exam_type = request.args.get('examType')
    
    score_model = Score()
    scores = score_model.get_scores(course_id, student_id, exam_type)
    
    return jsonify({
        'scores': scores,
        'total': len(scores)
    }), 200

@admin_bp.route('/scores', methods=['POST'])
def add_scores():
    """Add scores for students"""
    data = request.get_json()
    
    required_fields = ['courseId', 'examType', 'maxScore', 'scores']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'error': f'Missing required field: {field}'
            }), 400
    
    score_model = Score()
    
    success_count = 0
    for score_data in data['scores']:
        success = score_model.add_score(
            score_data['studentId'],
            data['courseId'],
            data['examType'],
            score_data['score'],
            data['maxScore']
        )
        if success:
            success_count += 1
    
    return jsonify({
        'message': f'Scores added for {success_count} students',
        'successCount': success_count
    }), 200

# Fee Management
@admin_bp.route('/fees', methods=['GET'])
def get_all_fees():
    """Get all fee records"""
    student_id = request.args.get('studentId')
    academic_year = request.args.get('academicYear')
    status = request.args.get('status')  # paid, pending, overdue
    
    fee_model = Fee()
    fees = fee_model.get_all_fees(student_id, academic_year, status)
    
    return jsonify({
        'fees': fees,
        'total': len(fees)
    }), 200

@admin_bp.route('/fees', methods=['POST'])
def create_fee_record():
    """Create fee record for student"""
    data = request.get_json()
    
    required_fields = ['studentId', 'feeType', 'amount', 'dueDate']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'error': f'Missing required field: {field}'
            }), 400
    
    fee_model = Fee()
    fee_id = fee_model.create_fee(data)
    
    return jsonify({
        'message': 'Fee record created successfully',
        'feeId': fee_id
    }), 201

@admin_bp.route('/fees/<fee_id>/payment', methods=['POST'])
def record_fee_payment():
    """Record fee payment"""
    data = request.get_json()
    
    fee_model = Fee()
    success = fee_model.record_payment(
        fee_id,
        data.get('paymentMethod', 'cash'),
        data.get('transactionId', ''),
        data.get('paidAmount')
    )
    
    if success:
        return jsonify({
            'message': 'Payment recorded successfully'
        }), 200
    else:
        return jsonify({
            'error': 'Failed to record payment'
        }), 500

# Timetable Management
@admin_bp.route('/timetable', methods=['GET'])
def get_timetable():
    """Get timetable"""
    semester = request.args.get('semester')
    day = request.args.get('day')
    
    timetable_model = Timetable()
    timetable = timetable_model.get_timetable(semester, day)
    
    return jsonify({
        'timetable': timetable
    }), 200

@admin_bp.route('/timetable', methods=['POST'])
def create_timetable_entry():
    """Create timetable entry"""
    data = request.get_json()
    
    required_fields = ['courseId', 'dayOfWeek', 'startTime', 'endTime', 'room']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'error': f'Missing required field: {field}'
            }), 400
    
    timetable_model = Timetable()
    entry_id = timetable_model.create_entry(data)
    
    return jsonify({
        'message': 'Timetable entry created successfully',
        'entryId': entry_id
    }), 201

# Notification Management
@admin_bp.route('/notifications', methods=['GET'])
def get_all_notifications():
    """Get all notifications"""
    notification_model = Notification()
    notifications = notification_model.get_all_notifications()
    
    return jsonify({
        'notifications': notifications,
        'total': len(notifications)
    }), 200

@admin_bp.route('/notifications', methods=['POST'])
def send_notification():
    """Send notification to students"""
    data = request.get_json()
    
    required_fields = ['title', 'message', 'recipients']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'error': f'Missing required field: {field}'
            }), 400
    
    notification_model = Notification()
    
    success_count = 0
    for recipient_id in data['recipients']:
        success = notification_model.create_notification(
            recipient_id,
            data['title'],
            data['message'],
            data.get('type', 'general')
        )
        if success:
            success_count += 1
    
    return jsonify({
        'message': f'Notification sent to {success_count} students',
        'successCount': success_count
    }), 200

# Dashboard Stats
@admin_bp.route('/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics"""
    student_model = Student()
    course_model = Course()
    fee_model = Fee()
    
    # Get student stats
    student_stats = student_model.get_student_stats()
    
    # Get course count
    courses = course_model.get_all_courses()
    course_count = len(courses)
    
    # Get pending fees count
    pending_fees = fee_model.get_all_fees(status='pending')
    pending_fees_count = len(pending_fees)
    
    # Get overdue fees count
    overdue_fees = fee_model.get_all_fees(status='overdue')
    overdue_fees_count = len(overdue_fees)
    
    return jsonify({
        'totalStudents': student_stats['totalStudents'],
        'totalCourses': course_count,
        'pendingFees': pending_fees_count,
        'overdueFees': overdue_fees_count,
        'semesterWiseStudents': student_stats['semesterWise']
    }), 200
