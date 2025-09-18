from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from datetime import datetime, timedelta
from models.user import User
from models.course import Course
from models.enrollment import Enrollment
from models.attendance import Attendance
from models.score import Score
from models.notification import Notification
from models.fee import Fee
from middleware.auth_middleware import admin_or_student_required, admin_required, handle_errors
from utils.helpers import get_semester_from_date, get_academic_year

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/student', methods=['GET'])
@admin_or_student_required
@handle_errors
def student_dashboard():
    """Get student dashboard data"""
    current_user_id = get_jwt_identity()
    current_user = request.current_user
    
    # If admin is accessing, they might want to see a specific student's dashboard
    student_id = request.args.get('studentId', current_user_id)
    
    # Check permissions
    if current_user.get('role') == 'student' and student_id != current_user_id:
        return jsonify({
            'error': 'Access denied',
            'message': 'Students can only access their own dashboard'
        }), 403
    
    # Get student info
    user_model = User()
    student = user_model.find_by_id(student_id)
    
    if not student or student.get('role') != 'student':
        return jsonify({
            'error': 'Student not found',
            'message': 'Invalid student ID'
        }), 404
    
    # Get current semester and academic year
    current_semester = get_semester_from_date()
    academic_year = get_academic_year()
    
    # Get enrolled courses
    enrollment_model = Enrollment()
    enrolled_courses = enrollment_model.get_student_current_courses(student_id, current_semester)
    
    # Get attendance summary
    attendance_model = Attendance()
    attendance_summary = attendance_model.get_student_overall_attendance(student_id)
    
    # Get recent scores
    score_model = Score()
    recent_scores = score_model.get_student_scores(student_id)[:5]  # Last 5 scores
    
    # Calculate current semester GPA
    gpa_data = score_model.calculate_student_gpa(student_id, current_semester)
    
    # Get notifications
    notification_model = Notification()
    notifications = notification_model.get_user_notifications(student_id, limit=10)
    unread_count = notification_model.get_unread_count(student_id)
    
    # Get fee status
    fee_model = Fee()
    fee_summary = fee_model.calculate_total_fees(student_id, academic_year)
    pending_fees = fee_model.get_pending_fees(student_id)
    
    dashboard_data = {
        'student': student,
        'academicInfo': {
            'currentSemester': current_semester,
            'academicYear': academic_year,
            'enrolledCourses': len(enrolled_courses),
            'currentGPA': gpa_data.get('gpa', 0)
        },
        'courses': enrolled_courses,
        'attendanceSummary': attendance_summary,
        'recentScores': recent_scores,
        'notifications': {
            'recent': notifications,
            'unreadCount': unread_count
        },
        'fees': {
            'summary': fee_summary,
            'pendingFees': len(pending_fees),
            'overdueFees': len([fee for fee in pending_fees if fee.get('dueDate', datetime.now()) < datetime.now()])
        }
    }
    
    return jsonify(dashboard_data), 200

@dashboard_bp.route('/admin', methods=['GET'])
@admin_required
@handle_errors
def admin_dashboard():
    """Get admin dashboard data"""
    
    # Get student statistics
    user_model = User()
    student_stats = user_model.get_student_stats()
    
    # Get course statistics
    course_model = Course()
    course_stats = course_model.get_course_stats()
    
    # Get enrollment statistics
    enrollment_model = Enrollment()
    enrollment_stats = enrollment_model.get_enrollment_stats()
    
    # Get attendance statistics (low attendance students)
    attendance_model = Attendance()
    low_attendance_students = attendance_model.get_low_attendance_students(threshold=75)
    
    # Get fee statistics
    fee_model = Fee()
    fee_stats = fee_model.get_fee_statistics()
    defaulters = fee_model.get_defaulters_list()
    
    # Get notification statistics
    notification_model = Notification()
    notification_stats = notification_model.get_notification_stats()
    
    # Recent activities (last 7 days)
    seven_days_ago = datetime.now() - timedelta(days=7)
    
    # Get recent enrollments
    recent_enrollments = enrollment_model.collection.count_documents({
        'createdAt': {'$gte': seven_days_ago}
    })
    
    # Get recent fee payments
    recent_payments = fee_model.collection.count_documents({
        'isPaid': True,
        'paymentDate': {'$gte': seven_days_ago}
    })
    
    dashboard_data = {
        'overview': {
            'totalStudents': student_stats.get('totalStudents', 0),
            'totalCourses': course_stats.get('totalCourses', 0),
            'totalEnrollments': enrollment_stats.get('totalEnrollments', 0),
            'lowAttendanceStudents': len(low_attendance_students),
            'feeDefaulters': len(defaulters),
            'unreadNotifications': notification_stats.get('unreadNotifications', 0)
        },
        'studentStats': student_stats,
        'courseStats': course_stats,
        'enrollmentStats': enrollment_stats,
        'feeStats': fee_stats,
        'recentActivities': {
            'newEnrollments': recent_enrollments,
            'feePayments': recent_payments
        },
        'alerts': {
            'lowAttendanceStudents': low_attendance_students[:10],  # Top 10
            'feeDefaulters': defaulters[:10],  # Top 10
            'overdueNotifications': notification_stats.get('unreadNotifications', 0)
        }
    }
    
    return jsonify(dashboard_data), 200

@dashboard_bp.route('/quick-stats', methods=['GET'])
@admin_required
@handle_errors
def quick_stats():
    """Get quick statistics for admin dashboard widgets"""
    
    user_model = User()
    course_model = Course()
    enrollment_model = Enrollment()
    attendance_model = Attendance()
    fee_model = Fee()
    
    # Get counts
    total_students = user_model.collection.count_documents({'role': 'student', 'isActive': True})
    total_courses = course_model.collection.count_documents({'isActive': True})
    total_enrollments = enrollment_model.collection.count_documents({'status': 'enrolled'})
    
    # Get today's attendance
    today = datetime.now().date()
    today_attendance = attendance_model.collection.count_documents({'date': today})
    
    # Get pending fees
    pending_fees_count = fee_model.collection.count_documents({'isPaid': False})
    
    # Get overdue fees
    overdue_fees_count = fee_model.collection.count_documents({
        'isPaid': False,
        'dueDate': {'$lt': datetime.now()}
    })
    
    stats = {
        'students': {
            'total': total_students,
            'active': total_students  # All retrieved students are active
        },
        'courses': {
            'total': total_courses,
            'active': total_courses  # All retrieved courses are active
        },
        'enrollments': {
            'total': total_enrollments
        },
        'attendance': {
            'today': today_attendance
        },
        'fees': {
            'pending': pending_fees_count,
            'overdue': overdue_fees_count
        }
    }
    
    return jsonify(stats), 200

@dashboard_bp.route('/recent-activities', methods=['GET'])
@admin_required
@handle_errors
def recent_activities():
    """Get recent system activities"""
    
    limit = int(request.args.get('limit', 20))
    days = int(request.args.get('days', 7))
    
    cutoff_date = datetime.now() - timedelta(days=days)
    
    activities = []
    
    # Recent user registrations
    user_model = User()
    recent_users = list(user_model.collection.find({
        'createdAt': {'$gte': cutoff_date},
        'role': 'student'
    }).sort('createdAt', -1).limit(10))
    
    for user in recent_users:
        activities.append({
            'type': 'user_registration',
            'description': f"New student registered: {user['profile']['firstName']} {user['profile']['lastName']}",
            'timestamp': user['createdAt'],
            'data': {
                'userId': str(user['_id']),
                'rollNumber': user['profile'].get('rollNumber')
            }
        })
    
    # Recent enrollments
    enrollment_model = Enrollment()
    recent_enrollments = list(enrollment_model.collection.find({
        'createdAt': {'$gte': cutoff_date}
    }).sort('createdAt', -1).limit(10))
    
    for enrollment in recent_enrollments:
        # Get student and course details
        student = user_model.collection.find_one({'_id': enrollment['studentId']})
        course = course_model.collection.find_one({'_id': enrollment['courseId']})
        
        if student and course:
            activities.append({
                'type': 'enrollment',
                'description': f"{student['profile']['firstName']} {student['profile']['lastName']} enrolled in {course['courseName']}",
                'timestamp': enrollment['createdAt'],
                'data': {
                    'studentId': str(enrollment['studentId']),
                    'courseId': str(enrollment['courseId'])
                }
            })
    
    # Recent fee payments
    fee_model = Fee()
    recent_payments = list(fee_model.collection.find({
        'isPaid': True,
        'paymentDate': {'$gte': cutoff_date}
    }).sort('paymentDate', -1).limit(10))
    
    for payment in recent_payments:
        student = user_model.collection.find_one({'_id': payment['studentId']})
        if student:
            activities.append({
                'type': 'fee_payment',
                'description': f"{student['profile']['firstName']} {student['profile']['lastName']} paid {payment['feeType']} fee: ₹{payment['amount']}",
                'timestamp': payment['paymentDate'],
                'data': {
                    'studentId': str(payment['studentId']),
                    'amount': payment['amount'],
                    'feeType': payment['feeType']
                }
            })
    
    # Sort all activities by timestamp
    activities.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return jsonify({
        'activities': activities[:limit],
        'total': len(activities)
    }), 200
