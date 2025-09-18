from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from datetime import datetime, timedelta
from bson import ObjectId
from models.user import User
from models.course import Course
from models.enrollment import Enrollment
from models.attendance import Attendance
from models.score import Score
from models.timetable import Timetable
from models.fee import Fee
from models.notification import Notification
from middleware.auth_middleware import admin_required, validate_request_data, handle_errors
from utils.helpers import validate_email, validate_roll_number, generate_roll_number, get_semester_from_date, get_academic_year

admin_bp = Blueprint('admin', __name__)

# Student Management Routes
@admin_bp.route('/students', methods=['GET'])
@admin_required
@handle_errors
def get_all_students():
    """Get all students with pagination"""
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    semester = request.args.get('semester')
    search = request.args.get('search')
    
    user_model = User()
    
    if semester:
        students = user_model.get_students_by_semester(semester)
        return jsonify({
            'students': students,
            'total': len(students),
            'semester': semester
        }), 200
    elif search:
        # Implement search functionality
        filter_query = {
            'role': 'student',
            'isActive': True,
            '$or': [
                {'profile.firstName': {'$regex': search, '$options': 'i'}},
                {'profile.lastName': {'$regex': search, '$options': 'i'}},
                {'profile.rollNumber': {'$regex': search, '$options': 'i'}},
                {'email': {'$regex': search, '$options': 'i'}}
            ]
        }
        
        students = list(user_model.collection.find(filter_query).sort('profile.rollNumber', 1))
        for student in students:
            del student['password']
        
        from utils.helpers import serialize_mongo_doc
        return jsonify({
            'students': serialize_mongo_doc(students),
            'total': len(students),
            'search': search
        }), 200
    else:
        result = user_model.get_all_students(page, limit)
        return jsonify(result), 200

@admin_bp.route('/students', methods=['POST'])
@admin_required
@validate_request_data(['username', 'email', 'password', 'profile'])
@handle_errors
def create_student():
    """Create a new student"""
    data = request.get_json()
    
    # Validate required profile fields
    profile = data.get('profile', {})
    required_profile_fields = ['firstName', 'lastName', 'year', 'semester', 'phone']
    
    for field in required_profile_fields:
        if field not in profile:
            return jsonify({
                'error': 'Missing profile field',
                'message': f'Profile field "{field}" is required'
            }), 400
    
    # Validate email
    if not validate_email(data['email']):
        return jsonify({
            'error': 'Invalid email',
            'message': 'Please provide a valid email address'
        }), 400
    
    user_model = User()
    
    # Check if username or email already exists
    if user_model.find_by_username(data['username']):
        return jsonify({
            'error': 'Username exists',
            'message': 'Username already exists'
        }), 400
    
    if user_model.find_by_email(data['email']):
        return jsonify({
            'error': 'Email exists',
            'message': 'Email already exists'
        }), 400
    
    # Generate roll number if not provided
    if 'rollNumber' not in profile:
        # Get count of students in the same year
        year = profile['year']
        count = user_model.collection.count_documents({
            'role': 'student',
            'profile.year': year
        }) + 1
        profile['rollNumber'] = generate_roll_number(year, count)
    
    # Validate roll number
    if not validate_roll_number(profile['rollNumber']):
        return jsonify({
            'error': 'Invalid roll number',
            'message': 'Roll number must be in format: YYCSE001'
        }), 400
    
    # Check if roll number already exists
    existing_student = user_model.collection.find_one({
        'profile.rollNumber': profile['rollNumber']
    })
    if existing_student:
        return jsonify({
            'error': 'Roll number exists',
            'message': 'Roll number already exists'
        }), 400
    
    # Set default values
    profile['department'] = 'CSE-AIML'
    if 'address' not in profile:
        profile['address'] = {}
    
    # Create user data
    user_data = {
        'username': data['username'],
        'email': data['email'],
        'password': data['password'],
        'role': 'student',
        'profile': profile
    }
    
    try:
        user_id = user_model.create_user(user_data)
        
        # Get created user (without password)
        created_user = user_model.find_by_id(user_id)
        
        return jsonify({
            'message': 'Student created successfully',
            'student': created_user
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to create student',
            'message': str(e)
        }), 500

@admin_bp.route('/students/<student_id>', methods=['PUT'])
@admin_required
@handle_errors
def update_student(student_id):
    """Update student information"""
    data = request.get_json()
    
    user_model = User()
    student = user_model.find_by_id(student_id)
    
    if not student or student.get('role') != 'student':
        return jsonify({
            'error': 'Student not found',
            'message': 'Invalid student ID'
        }), 404
    
    # Fields that can be updated
    allowed_fields = ['email', 'profile']
    update_data = {}
    
    for field in allowed_fields:
        if field in data:
            if field == 'email' and data[field] != student.get('email'):
                # Validate new email
                if not validate_email(data[field]):
                    return jsonify({
                        'error': 'Invalid email',
                        'message': 'Please provide a valid email address'
                    }), 400
                
                # Check if email already exists
                if user_model.find_by_email(data[field]):
                    return jsonify({
                        'error': 'Email exists',
                        'message': 'Email already exists'
                    }), 400
            
            update_data[field] = data[field]
    
    if not update_data:
        return jsonify({
            'error': 'No valid fields to update',
            'message': 'Please provide valid fields to update'
        }), 400
    
    success = user_model.update_user(student_id, update_data)
    
    if success:
        updated_student = user_model.find_by_id(student_id)
        return jsonify({
            'message': 'Student updated successfully',
            'student': updated_student
        }), 200
    else:
        return jsonify({
            'error': 'Update failed',
            'message': 'Failed to update student'
        }), 500

@admin_bp.route('/students/<student_id>', methods=['DELETE'])
@admin_required
@handle_errors
def deactivate_student(student_id):
    """Deactivate a student (soft delete)"""
    user_model = User()
    student = user_model.find_by_id(student_id)
    
    if not student or student.get('role') != 'student':
        return jsonify({
            'error': 'Student not found',
            'message': 'Invalid student ID'
        }), 404
    
    success = user_model.deactivate_user(student_id)
    
    if success:
        return jsonify({
            'message': 'Student deactivated successfully'
        }), 200
    else:
        return jsonify({
            'error': 'Deactivation failed',
            'message': 'Failed to deactivate student'
        }), 500

# Course Management Routes
@admin_bp.route('/courses', methods=['GET'])
@admin_required
@handle_errors
def get_all_courses():
    """Get all courses"""
    semester = request.args.get('semester')
    search = request.args.get('search')
    
    course_model = Course()
    
    if search:
        courses = course_model.search_courses(search)
        return jsonify({
            'courses': courses,
            'total': len(courses),
            'search': search
        }), 200
    elif semester:
        courses = course_model.get_courses_by_semester(int(semester))
        return jsonify({
            'courses': courses,
            'total': len(courses),
            'semester': semester
        }), 200
    else:
        courses = course_model.get_all_courses()
        return jsonify({
            'courses': courses,
            'total': len(courses)
        }), 200

@admin_bp.route('/courses', methods=['POST'])
@admin_required
@validate_request_data(['courseCode', 'courseName', 'credits', 'semester', 'faculty'])
@handle_errors
def create_course():
    """Create a new course"""
    data = request.get_json()
    
    course_model = Course()
    
    # Check if course code already exists
    if course_model.find_by_code(data['courseCode']):
        return jsonify({
            'error': 'Course code exists',
            'message': 'Course code already exists'
        }), 400
    
    # Set default values
    course_data = data.copy()
    if 'description' not in course_data:
        course_data['description'] = ''
    if 'prerequisites' not in course_data:
        course_data['prerequisites'] = []
    
    try:
        course_id = course_model.create_course(course_data)
        created_course = course_model.find_by_id(course_id)
        
        return jsonify({
            'message': 'Course created successfully',
            'course': created_course
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to create course',
            'message': str(e)
        }), 500

@admin_bp.route('/courses/<course_id>', methods=['PUT'])
@admin_required
@handle_errors
def update_course(course_id):
    """Update course information"""
    data = request.get_json()
    
    course_model = Course()
    course = course_model.find_by_id(course_id)
    
    if not course:
        return jsonify({
            'error': 'Course not found',
            'message': 'Invalid course ID'
        }), 404
    
    # Check if new course code conflicts with existing ones
    if 'courseCode' in data and data['courseCode'] != course.get('courseCode'):
        if course_model.find_by_code(data['courseCode']):
            return jsonify({
                'error': 'Course code exists',
                'message': 'Course code already exists'
            }), 400
    
    success = course_model.update_course(course_id, data)
    
    if success:
        updated_course = course_model.find_by_id(course_id)
        return jsonify({
            'message': 'Course updated successfully',
            'course': updated_course
        }), 200
    else:
        return jsonify({
            'error': 'Update failed',
            'message': 'Failed to update course'
        }), 500

# Enrollment Management Routes
@admin_bp.route('/enrollments', methods=['POST'])
@admin_required
@validate_request_data(['studentIds', 'courseId', 'semester', 'academicYear'])
@handle_errors
def bulk_enroll_students():
    """Bulk enroll students in a course"""
    data = request.get_json()
    
    student_ids = data['studentIds']
    course_id = data['courseId']
    semester = data['semester']
    academic_year = data['academicYear']
    
    # Validate course exists
    course_model = Course()
    course = course_model.find_by_id(course_id)
    
    if not course:
        return jsonify({
            'error': 'Course not found',
            'message': 'Invalid course ID'
        }), 404
    
    # Validate students exist
    user_model = User()
    for student_id in student_ids:
        student = user_model.find_by_id(student_id)
        if not student or student.get('role') != 'student':
            return jsonify({
                'error': 'Invalid student',
                'message': f'Student with ID {student_id} not found'
            }), 404
    
    enrollment_model = Enrollment()
    
    try:
        enrolled_count = enrollment_model.bulk_enroll_students(
            student_ids, course_id, semester, academic_year
        )
        
        return jsonify({
            'message': f'Successfully enrolled {enrolled_count} students',
            'enrolledCount': enrolled_count,
            'course': course
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Enrollment failed',
            'message': str(e)
        }), 500

# Attendance Management Routes
@admin_bp.route('/attendance', methods=['POST'])
@admin_required
@validate_request_data(['attendanceRecords'])
@handle_errors
def mark_attendance():
    """Mark attendance for multiple students"""
    data = request.get_json()
    attendance_records = data['attendanceRecords']
    
    # Validate attendance records
    for record in attendance_records:
        required_fields = ['studentId', 'courseId', 'date', 'status']
        for field in required_fields:
            if field not in record:
                return jsonify({
                    'error': 'Invalid attendance record',
                    'message': f'Field "{field}" is required in attendance records'
                }), 400
        
        # Convert date string to date object
        if isinstance(record['date'], str):
            try:
                record['date'] = datetime.fromisoformat(record['date'].replace('Z', '+00:00')).date()
            except ValueError:
                return jsonify({
                    'error': 'Invalid date format',
                    'message': 'Date must be in ISO format'
                }), 400
        
        # Convert string IDs to ObjectId
        record['studentId'] = ObjectId(record['studentId'])
        record['courseId'] = ObjectId(record['courseId'])
        
        # Add admin who marked attendance
        record['markedBy'] = ObjectId(get_jwt_identity())
        
        # Set default session type
        if 'sessionType' not in record:
            record['sessionType'] = 'theory'
    
    attendance_model = Attendance()
    
    try:
        marked_count = attendance_model.bulk_mark_attendance(attendance_records)
        
        return jsonify({
            'message': f'Successfully marked attendance for {marked_count} records',
            'markedCount': marked_count
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to mark attendance',
            'message': str(e)
        }), 500

@admin_bp.route('/attendance/report', methods=['GET'])
@admin_required
@handle_errors
def get_attendance_report():
    """Get attendance report for a course"""
    course_id = request.args.get('courseId')
    start_date_str = request.args.get('startDate')
    end_date_str = request.args.get('endDate')
    
    if not course_id or not start_date_str or not end_date_str:
        return jsonify({
            'error': 'Missing parameters',
            'message': 'courseId, startDate, and endDate are required'
        }), 400
    
    try:
        start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00')).date()
        end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00')).date()
    except ValueError:
        return jsonify({
            'error': 'Invalid date format',
            'message': 'Dates must be in ISO format'
        }), 400
    
    attendance_model = Attendance()
    report = attendance_model.get_attendance_report(course_id, start_date, end_date)
    
    return jsonify({
        'report': report,
        'courseId': course_id,
        'startDate': start_date_str,
        'endDate': end_date_str
    }), 200

# Score Management Routes
@admin_bp.route('/scores', methods=['POST'])
@admin_required
@validate_request_data(['scores'])
@handle_errors
def add_scores():
    """Add scores for students"""
    data = request.get_json()
    scores_data = data['scores']
    
    # Validate score records
    for score in scores_data:
        required_fields = ['studentId', 'courseId', 'examType', 'marks', 'maxMarks']
        for field in required_fields:
            if field not in score:
                return jsonify({
                    'error': 'Invalid score record',
                    'message': f'Field "{field}" is required in score records'
                }), 400
        
        # Convert string IDs to ObjectId
        score['studentId'] = ObjectId(score['studentId'])
        score['courseId'] = ObjectId(score['courseId'])
        
        # Set default values
        if 'examDate' not in score:
            score['examDate'] = datetime.now()
        elif isinstance(score['examDate'], str):
            score['examDate'] = datetime.fromisoformat(score['examDate'].replace('Z', '+00:00'))
        
        if 'semester' not in score:
            score['semester'] = get_semester_from_date()
    
    score_model = Score()
    
    try:
        added_count = score_model.bulk_add_scores(scores_data)
        
        return jsonify({
            'message': f'Successfully added {added_count} score records',
            'addedCount': added_count
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to add scores',
            'message': str(e)
        }), 500

# Fee Management Routes
@admin_bp.route('/fees', methods=['POST'])
@admin_required
@validate_request_data(['studentIds', 'feeData'])
@handle_errors
def create_fees():
    """Create fee records for students"""
    data = request.get_json()
    student_ids = data['studentIds']
    fee_data = data['feeData']
    
    # Validate fee data
    required_fields = ['feeType', 'amount', 'dueDate', 'academicYear']
    for field in required_fields:
        if field not in fee_data:
            return jsonify({
                'error': 'Invalid fee data',
                'message': f'Field "{field}" is required in fee data'
            }), 400
    
    # Convert date string to datetime object
    if isinstance(fee_data['dueDate'], str):
        try:
            fee_data['dueDate'] = datetime.fromisoformat(fee_data['dueDate'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({
                'error': 'Invalid date format',
                'message': 'Due date must be in ISO format'
            }), 400
    
    fee_model = Fee()
    
    try:
        created_count = fee_model.bulk_create_fees(student_ids, fee_data)
        
        return jsonify({
            'message': f'Successfully created {created_count} fee records',
            'createdCount': created_count
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to create fees',
            'message': str(e)
        }), 500

@admin_bp.route('/fees/<fee_id>/payment', methods=['PUT'])
@admin_required
@validate_request_data(['paymentMethod', 'transactionId'])
@handle_errors
def update_fee_payment(fee_id):
    """Update fee payment status"""
    data = request.get_json()
    
    payment_data = {
        'paymentMethod': data['paymentMethod'],
        'transactionId': data['transactionId'],
        'paymentReference': data.get('paymentReference', ''),
        'paymentDate': datetime.now()
    }
    
    fee_model = Fee()
    success = fee_model.update_payment_status(fee_id, payment_data)
    
    if success:
        updated_fee = fee_model.get_fee_by_id(fee_id)
        return jsonify({
            'message': 'Payment status updated successfully',
            'fee': updated_fee
        }), 200
    else:
        return jsonify({
            'error': 'Update failed',
            'message': 'Failed to update payment status'
        }), 500

# Notification Management Routes
@admin_bp.route('/notifications/broadcast', methods=['POST'])
@admin_required
@validate_request_data(['title', 'message', 'category'])
@handle_errors
def broadcast_notification():
    """Send notification to multiple users"""
    data = request.get_json()
    
    notification_data = {
        'title': data['title'],
        'message': data['message'],
        'category': data['category'],
        'priority': data.get('priority', 'normal'),
        'link': data.get('link', ''),
        'metadata': data.get('metadata', {})
    }
    
    notification_model = Notification()
    
    # Determine recipients
    target = data.get('target', 'all_students')
    
    if target == 'all_students':
        sent_count = notification_model.send_to_all_students(notification_data)
    elif target == 'semester_students':
        semester = data.get('semester')
        if not semester:
            return jsonify({
                'error': 'Missing semester',
                'message': 'Semester is required when targeting semester students'
            }), 400
        sent_count = notification_model.send_to_semester_students(notification_data, semester)
    elif target == 'specific_users':
        user_ids = data.get('userIds', [])
        if not user_ids:
            return jsonify({
                'error': 'Missing user IDs',
                'message': 'User IDs are required when targeting specific users'
            }), 400
        sent_count = notification_model.broadcast_notification(notification_data, user_ids)
    else:
        return jsonify({
            'error': 'Invalid target',
            'message': 'Target must be one of: all_students, semester_students, specific_users'
        }), 400
    
    return jsonify({
        'message': f'Notification sent to {sent_count} users',
        'sentCount': sent_count
    }), 201

# Statistics and Reports Routes
@admin_bp.route('/statistics/overview', methods=['GET'])
@admin_required
@handle_errors
def get_system_statistics():
    """Get comprehensive system statistics"""
    user_model = User()
    course_model = Course()
    enrollment_model = Enrollment()
    attendance_model = Attendance()
    fee_model = Fee()
    
    stats = {
        'students': user_model.get_student_stats(),
        'courses': course_model.get_course_stats(),
        'enrollments': enrollment_model.get_enrollment_stats(),
        'fees': fee_model.get_fee_statistics(),
        'lowAttendance': len(attendance_model.get_low_attendance_students()),
        'feeDefaulters': len(fee_model.get_defaulters_list())
    }
    
    return jsonify(stats), 200
