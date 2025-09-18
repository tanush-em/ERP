from flask import Blueprint, request, jsonify
from models.course import Course
from models.timetable import Timetable
from models.notification import Notification
from middleware.auth_middleware import admin_or_student_required, handle_errors

common_bp = Blueprint('common', __name__)

@common_bp.route('/courses', methods=['GET'])
@admin_or_student_required
@handle_errors
def get_courses():
    """Get courses (accessible by both admin and students)"""
    semester = request.args.get('semester')
    search = request.args.get('search')
    
    course_model = Course()
    
    if search:
        courses = course_model.search_courses(search)
    elif semester:
        courses = course_model.get_courses_by_semester(int(semester))
    else:
        courses = course_model.get_all_courses()
    
    return jsonify({
        'courses': courses,
        'total': len(courses)
    }), 200

@common_bp.route('/courses/<course_id>', methods=['GET'])
@admin_or_student_required
@handle_errors
def get_course_details(course_id):
    """Get detailed course information"""
    course_model = Course()
    course = course_model.find_by_id(course_id)
    
    if not course:
        return jsonify({
            'error': 'Course not found',
            'message': 'Invalid course ID'
        }), 404
    
    # Get course timetable
    timetable_model = Timetable()
    timetable = timetable_model.get_course_timetable(course_id)
    
    course['timetable'] = timetable
    
    return jsonify({
        'course': course
    }), 200

@common_bp.route('/timetable', methods=['GET'])
@admin_or_student_required
@handle_errors
def get_timetable():
    """Get timetable information"""
    semester = request.args.get('semester')
    course_id = request.args.get('courseId')
    room_number = request.args.get('roomNumber')
    faculty = request.args.get('faculty')
    day = request.args.get('day')
    
    timetable_model = Timetable()
    
    if course_id:
        timetable = timetable_model.get_course_timetable(course_id)
    elif room_number:
        timetable = timetable_model.get_room_schedule(room_number, day)
    elif faculty:
        timetable = timetable_model.get_faculty_schedule(faculty, day)
    elif semester:
        if request.args.get('weekly') == 'true':
            timetable = timetable_model.get_weekly_schedule(semester)
        else:
            timetable = timetable_model.get_semester_timetable(semester)
    else:
        return jsonify({
            'error': 'Missing parameters',
            'message': 'Please provide at least one filter parameter'
        }), 400
    
    return jsonify({
        'timetable': timetable
    }), 200

@common_bp.route('/notifications/categories', methods=['GET'])
@admin_or_student_required
@handle_errors
def get_notification_categories():
    """Get available notification categories"""
    categories = [
        {'value': 'academic', 'label': 'Academic'},
        {'value': 'exam', 'label': 'Examination'},
        {'value': 'fee', 'label': 'Fees'},
        {'value': 'event', 'label': 'Events'},
        {'value': 'announcement', 'label': 'Announcements'},
        {'value': 'attendance', 'label': 'Attendance'},
        {'value': 'result', 'label': 'Results'},
        {'value': 'general', 'label': 'General'}
    ]
    
    return jsonify({
        'categories': categories
    }), 200

@common_bp.route('/academic-info', methods=['GET'])
@admin_or_student_required
@handle_errors
def get_academic_info():
    """Get academic year and semester information"""
    from utils.helpers import get_semester_from_date, get_academic_year
    from datetime import datetime
    
    current_semester = get_semester_from_date()
    academic_year = get_academic_year()
    
    # Generate semester options
    current_year = datetime.now().year
    semesters = []
    
    for year in range(current_year - 2, current_year + 2):
        semesters.append({
            'value': f'ODD-{year}',
            'label': f'Odd Semester {year}'
        })
        semesters.append({
            'value': f'EVEN-{year + 1}',
            'label': f'Even Semester {year + 1}'
        })
    
    # Generate academic year options
    academic_years = []
    for year in range(current_year - 3, current_year + 2):
        academic_years.append({
            'value': f'{year}-{year + 1}',
            'label': f'{year}-{year + 1}'
        })
    
    return jsonify({
        'currentSemester': current_semester,
        'currentAcademicYear': academic_year,
        'semesterOptions': semesters,
        'academicYearOptions': academic_years
    }), 200

@common_bp.route('/search', methods=['GET'])
@admin_or_student_required
@handle_errors
def global_search():
    """Global search across students, courses, and other entities"""
    query = request.args.get('q')
    entity_type = request.args.get('type', 'all')  # all, students, courses
    limit = int(request.args.get('limit', 20))
    
    if not query or len(query.strip()) < 2:
        return jsonify({
            'error': 'Invalid query',
            'message': 'Search query must be at least 2 characters long'
        }), 400
    
    results = {
        'students': [],
        'courses': [],
        'total': 0
    }
    
    # Search students
    if entity_type in ['all', 'students']:
        from models.user import User
        user_model = User()
        
        student_filter = {
            'role': 'student',
            'isActive': True,
            '$or': [
                {'profile.firstName': {'$regex': query, '$options': 'i'}},
                {'profile.lastName': {'$regex': query, '$options': 'i'}},
                {'profile.rollNumber': {'$regex': query, '$options': 'i'}},
                {'email': {'$regex': query, '$options': 'i'}}
            ]
        }
        
        students = list(user_model.collection.find(student_filter).limit(limit // 2 if entity_type == 'all' else limit))
        
        # Remove sensitive data
        for student in students:
            del student['password']
        
        from utils.helpers import serialize_mongo_doc
        results['students'] = serialize_mongo_doc(students)
    
    # Search courses
    if entity_type in ['all', 'courses']:
        course_model = Course()
        courses = course_model.search_courses(query)
        
        if entity_type == 'all':
            courses = courses[:limit // 2]
        else:
            courses = courses[:limit]
        
        results['courses'] = courses
    
    results['total'] = len(results['students']) + len(results['courses'])
    
    return jsonify(results), 200

@common_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    from utils.database import get_db
    
    try:
        # Test database connection
        db = get_db()
        db.command('ping')
        
        return jsonify({
            'status': 'healthy',
            'message': 'ERP system is running properly',
            'database': 'connected',
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'message': 'System health check failed',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500
