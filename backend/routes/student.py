from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from datetime import datetime, timedelta
from models.user import User
from models.course import Course
from models.enrollment import Enrollment
from models.attendance import Attendance
from models.score import Score
from models.timetable import Timetable
from models.fee import Fee
from models.notification import Notification
from middleware.auth_middleware import admin_or_student_required, can_access_student_data, handle_errors
from utils.helpers import get_semester_from_date, get_academic_year

student_bp = Blueprint('student', __name__)

@student_bp.route('/courses', methods=['GET'])
@admin_or_student_required
@handle_errors
def get_student_courses():
    """Get courses for a student"""
    student_id = request.args.get('studentId') or get_jwt_identity()
    
    # Check permissions
    if not can_access_student_data(student_id):
        return jsonify({
            'error': 'Access denied',
            'message': 'You can only access your own data'
        }), 403
    
    semester = request.args.get('semester') or get_semester_from_date()
    status = request.args.get('status', 'enrolled')
    
    enrollment_model = Enrollment()
    
    if semester:
        courses = enrollment_model.get_student_current_courses(student_id, semester)
    else:
        courses = enrollment_model.get_student_enrollments(student_id, status)
    
    return jsonify({
        'courses': courses,
        'semester': semester,
        'total': len(courses)
    }), 200

@student_bp.route('/timetable', methods=['GET'])
@admin_or_student_required
@handle_errors
def get_student_timetable():
    """Get timetable for a student"""
    student_id = request.args.get('studentId') or get_jwt_identity()
    
    # Check permissions
    if not can_access_student_data(student_id):
        return jsonify({
            'error': 'Access denied',
            'message': 'You can only access your own data'
        }), 403
    
    semester = request.args.get('semester') or get_semester_from_date()
    
    timetable_model = Timetable()
    timetable = timetable_model.get_student_timetable(student_id, semester)
    
    # Organize by day of week
    weekly_schedule = {
        'Monday': [],
        'Tuesday': [],
        'Wednesday': [],
        'Thursday': [],
        'Friday': [],
        'Saturday': []
    }
    
    for entry in timetable:
        day = entry.get('dayOfWeek')
        if day in weekly_schedule:
            weekly_schedule[day].append(entry)
    
    return jsonify({
        'timetable': weekly_schedule,
        'semester': semester
    }), 200

@student_bp.route('/attendance', methods=['GET'])
@admin_or_student_required
@handle_errors
def get_student_attendance():
    """Get attendance records for a student"""
    student_id = request.args.get('studentId') or get_jwt_identity()
    
    # Check permissions
    if not can_access_student_data(student_id):
        return jsonify({
            'error': 'Access denied',
            'message': 'You can only access your own data'
        }), 403
    
    course_id = request.args.get('courseId')
    start_date_str = request.args.get('startDate')
    end_date_str = request.args.get('endDate')
    
    start_date = None
    end_date = None
    
    if start_date_str:
        start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00')).date()
    if end_date_str:
        end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00')).date()
    
    attendance_model = Attendance()
    
    if request.args.get('summary') == 'true':
        # Get attendance summary
        attendance_summary = attendance_model.get_student_overall_attendance(student_id)
        return jsonify({
            'summary': attendance_summary
        }), 200
    else:
        # Get detailed attendance records
        attendance_records = attendance_model.get_student_attendance(
            student_id, course_id, start_date, end_date
        )
        
        # Calculate percentage if course_id is provided
        percentage_data = None
        if course_id:
            percentage_data = attendance_model.calculate_student_attendance_percentage(
                student_id, course_id, start_date, end_date
            )
        
        return jsonify({
            'attendance': attendance_records,
            'percentage': percentage_data,
            'total': len(attendance_records)
        }), 200

@student_bp.route('/scores', methods=['GET'])
@admin_or_student_required
@handle_errors
def get_student_scores():
    """Get scores/grades for a student"""
    student_id = request.args.get('studentId') or get_jwt_identity()
    
    # Check permissions
    if not can_access_student_data(student_id):
        return jsonify({
            'error': 'Access denied',
            'message': 'You can only access your own data'
        }), 403
    
    course_id = request.args.get('courseId')
    exam_type = request.args.get('examType')
    
    score_model = Score()
    scores = score_model.get_student_scores(student_id, course_id, exam_type)
    
    return jsonify({
        'scores': scores,
        'total': len(scores)
    }), 200

@student_bp.route('/gpa', methods=['GET'])
@admin_or_student_required
@handle_errors
def get_student_gpa():
    """Get GPA for a student"""
    student_id = request.args.get('studentId') or get_jwt_identity()
    
    # Check permissions
    if not can_access_student_data(student_id):
        return jsonify({
            'error': 'Access denied',
            'message': 'You can only access your own data'
        }), 403
    
    semester = request.args.get('semester')
    
    score_model = Score()
    gpa_data = score_model.calculate_student_gpa(student_id, semester)
    
    return jsonify(gpa_data), 200

@student_bp.route('/transcript', methods=['GET'])
@admin_or_student_required
@handle_errors
def get_student_transcript():
    """Get complete academic transcript for a student"""
    student_id = request.args.get('studentId') or get_jwt_identity()
    
    # Check permissions
    if not can_access_student_data(student_id):
        return jsonify({
            'error': 'Access denied',
            'message': 'You can only access your own data'
        }), 403
    
    score_model = Score()
    transcript = score_model.get_student_transcript(student_id)
    
    return jsonify(transcript), 200

@student_bp.route('/fees', methods=['GET'])
@admin_or_student_required
@handle_errors
def get_student_fees():
    """Get fee records for a student"""
    student_id = request.args.get('studentId') or get_jwt_identity()
    
    # Check permissions
    if not can_access_student_data(student_id):
        return jsonify({
            'error': 'Access denied',
            'message': 'You can only access your own data'
        }), 403
    
    academic_year = request.args.get('academicYear') or get_academic_year()
    
    fee_model = Fee()
    
    if request.args.get('summary') == 'true':
        # Get fee summary
        fee_summary = fee_model.calculate_total_fees(student_id, academic_year)
        return jsonify(fee_summary), 200
    else:
        # Get detailed fee records
        fees = fee_model.get_student_fees(student_id, academic_year)
        return jsonify({
            'fees': fees,
            'academicYear': academic_year,
            'total': len(fees)
        }), 200

@student_bp.route('/fees/pending', methods=['GET'])
@admin_or_student_required
@handle_errors
def get_pending_fees():
    """Get pending fees for a student"""
    student_id = request.args.get('studentId') or get_jwt_identity()
    
    # Check permissions
    if not can_access_student_data(student_id):
        return jsonify({
            'error': 'Access denied',
            'message': 'You can only access your own data'
        }), 403
    
    fee_model = Fee()
    pending_fees = fee_model.get_pending_fees(student_id)
    overdue_fees = fee_model.get_overdue_fees(student_id)
    
    return jsonify({
        'pendingFees': pending_fees,
        'overdueFees': overdue_fees,
        'totalPending': len(pending_fees),
        'totalOverdue': len(overdue_fees)
    }), 200

@student_bp.route('/fees/<fee_id>/receipt', methods=['GET'])
@admin_or_student_required
@handle_errors
def get_fee_receipt(fee_id):
    """Get fee receipt for a student"""
    current_user_id = get_jwt_identity()
    current_user = request.current_user
    
    fee_model = Fee()
    fee = fee_model.get_fee_by_id(fee_id)
    
    if not fee:
        return jsonify({
            'error': 'Fee record not found',
            'message': 'Invalid fee ID'
        }), 404
    
    # Check permissions
    if current_user.get('role') == 'student' and str(fee['studentId']) != current_user_id:
        return jsonify({
            'error': 'Access denied',
            'message': 'You can only access your own fee receipts'
        }), 403
    
    if not fee.get('isPaid'):
        return jsonify({
            'error': 'Fee not paid',
            'message': 'Receipt is only available for paid fees'
        }), 400
    
    receipt = fee_model.generate_fee_receipt(fee_id)
    
    return jsonify(receipt), 200

@student_bp.route('/notifications', methods=['GET'])
@admin_or_student_required
@handle_errors
def get_student_notifications():
    """Get notifications for a student"""
    student_id = request.args.get('studentId') or get_jwt_identity()
    
    # Check permissions
    if not can_access_student_data(student_id):
        return jsonify({
            'error': 'Access denied',
            'message': 'You can only access your own notifications'
        }), 403
    
    is_read = request.args.get('isRead')
    limit = int(request.args.get('limit', 50))
    
    if is_read is not None:
        is_read = is_read.lower() == 'true'
    
    notification_model = Notification()
    notifications = notification_model.get_user_notifications(student_id, is_read, limit)
    unread_count = notification_model.get_unread_count(student_id)
    
    return jsonify({
        'notifications': notifications,
        'unreadCount': unread_count,
        'total': len(notifications)
    }), 200

@student_bp.route('/notifications/<notification_id>/read', methods=['PUT'])
@admin_or_student_required
@handle_errors
def mark_notification_read(notification_id):
    """Mark a notification as read"""
    current_user_id = get_jwt_identity()
    
    notification_model = Notification()
    success = notification_model.mark_as_read(notification_id, current_user_id)
    
    if success:
        return jsonify({
            'message': 'Notification marked as read'
        }), 200
    else:
        return jsonify({
            'error': 'Failed to mark notification as read',
            'message': 'Notification not found or access denied'
        }), 404

@student_bp.route('/notifications/mark-all-read', methods=['PUT'])
@admin_or_student_required
@handle_errors
def mark_all_notifications_read():
    """Mark all notifications as read for current user"""
    current_user_id = get_jwt_identity()
    
    notification_model = Notification()
    count = notification_model.mark_all_as_read(current_user_id)
    
    return jsonify({
        'message': f'{count} notifications marked as read',
        'count': count
    }), 200

@student_bp.route('/profile', methods=['GET'])
@admin_or_student_required
@handle_errors
def get_student_profile():
    """Get detailed student profile"""
    student_id = request.args.get('studentId') or get_jwt_identity()
    
    # Check permissions
    if not can_access_student_data(student_id):
        return jsonify({
            'error': 'Access denied',
            'message': 'You can only access your own profile'
        }), 403
    
    user_model = User()
    student = user_model.find_by_id(student_id)
    
    if not student or student.get('role') != 'student':
        return jsonify({
            'error': 'Student not found',
            'message': 'Invalid student ID'
        }), 404
    
    # Remove sensitive data
    student_profile = student.copy()
    del student_profile['password']
    
    # Get additional academic information
    enrollment_model = Enrollment()
    current_semester = get_semester_from_date()
    enrolled_courses = enrollment_model.get_student_current_courses(student_id, current_semester)
    
    score_model = Score()
    gpa_data = score_model.calculate_student_gpa(student_id)
    
    student_profile['academicInfo'] = {
        'currentSemester': current_semester,
        'enrolledCourses': len(enrolled_courses),
        'overallGPA': gpa_data.get('gpa', 0)
    }
    
    return jsonify({
        'student': student_profile
    }), 200
