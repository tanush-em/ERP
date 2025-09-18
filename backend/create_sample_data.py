#!/usr/bin/env python3
"""
Sample data creation script for College ERP System
Run this script to populate the database with test data
"""

import sys
import os
from datetime import datetime, timedelta, date
from bson import ObjectId

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.user import User
from models.course import Course
from models.enrollment import Enrollment
from models.attendance import Attendance
from models.score import Score
from models.timetable import Timetable
from models.fee import Fee
from models.notification import Notification
from utils.database import init_db
from utils.helpers import get_semester_from_date, get_academic_year

def create_admin_users():
    """Create admin users"""
    print("Creating admin users...")
    
    user_model = User()
    
    # Check if admin already exists
    if user_model.find_by_username('admin'):
        print("Admin user already exists, skipping...")
        return
    
    admin_data = {
        'username': 'admin',
        'email': 'admin@college.edu',
        'password': 'admin123',
        'role': 'admin',
        'profile': {
            'firstName': 'System',
            'lastName': 'Administrator',
            'department': 'CSE-AIML',
            'phone': '+91-9876543210',
            'address': {
                'street': 'College Campus',
                'city': 'Bangalore',
                'state': 'Karnataka',
                'pincode': '560001'
            }
        }
    }
    
    admin_id = user_model.create_user(admin_data)
    print(f"Created admin user with ID: {admin_id}")

def create_courses():
    """Create sample courses"""
    print("Creating courses...")
    
    course_model = Course()
    
    courses_data = [
        # Semester 1
        {
            'courseCode': 'CSE101',
            'courseName': 'Programming Fundamentals',
            'credits': 4,
            'semester': 1,
            'faculty': 'Dr. Rajesh Kumar',
            'description': 'Introduction to programming concepts using Python'
        },
        {
            'courseCode': 'MAT101',
            'courseName': 'Engineering Mathematics I',
            'credits': 4,
            'semester': 1,
            'faculty': 'Dr. Priya Sharma',
            'description': 'Calculus, Linear Algebra, and Differential Equations'
        },
        {
            'courseCode': 'PHY101',
            'courseName': 'Engineering Physics',
            'credits': 3,
            'semester': 1,
            'faculty': 'Dr. Amit Verma',
            'description': 'Fundamentals of Physics for Engineers'
        },
        {
            'courseCode': 'ENG101',
            'courseName': 'Technical English',
            'credits': 2,
            'semester': 1,
            'faculty': 'Prof. Sarah Johnson',
            'description': 'English communication skills for technical professionals'
        },
        
        # Semester 2
        {
            'courseCode': 'CSE201',
            'courseName': 'Data Structures and Algorithms',
            'credits': 4,
            'semester': 2,
            'faculty': 'Dr. Rajesh Kumar',
            'description': 'Fundamental data structures and algorithmic techniques'
        },
        {
            'courseCode': 'CSE202',
            'courseName': 'Object Oriented Programming',
            'credits': 4,
            'semester': 2,
            'faculty': 'Dr. Meera Patel',
            'description': 'OOP concepts using Java'
        },
        {
            'courseCode': 'MAT201',
            'courseName': 'Engineering Mathematics II',
            'credits': 4,
            'semester': 2,
            'faculty': 'Dr. Priya Sharma',
            'description': 'Advanced mathematical concepts for engineering'
        },
        
        # Semester 3
        {
            'courseCode': 'CSE301',
            'courseName': 'Database Management Systems',
            'credits': 4,
            'semester': 3,
            'faculty': 'Dr. Arun Singh',
            'description': 'Database design, SQL, and database administration'
        },
        {
            'courseCode': 'CSE302',
            'courseName': 'Computer Networks',
            'credits': 4,
            'semester': 3,
            'faculty': 'Dr. Kavita Joshi',
            'description': 'Network protocols, architecture, and security'
        },
        {
            'courseCode': 'CSE303',
            'courseName': 'Operating Systems',
            'credits': 4,
            'semester': 3,
            'faculty': 'Dr. Suresh Reddy',
            'description': 'OS concepts, process management, and memory management'
        },
        
        # AI/ML Specific Courses
        {
            'courseCode': 'AI401',
            'courseName': 'Introduction to Artificial Intelligence',
            'credits': 4,
            'semester': 4,
            'faculty': 'Dr. Neha Gupta',
            'description': 'Fundamentals of AI, search algorithms, and knowledge representation'
        },
        {
            'courseCode': 'ML401',
            'courseName': 'Machine Learning',
            'credits': 4,
            'semester': 4,
            'faculty': 'Dr. Rohit Agarwal',
            'description': 'Supervised and unsupervised learning algorithms'
        },
        {
            'courseCode': 'DL501',
            'courseName': 'Deep Learning',
            'credits': 4,
            'semester': 5,
            'faculty': 'Dr. Anita Desai',
            'description': 'Neural networks, CNN, RNN, and deep learning frameworks'
        }
    ]
    
    created_courses = []
    for course_data in courses_data:
        # Check if course already exists
        if not course_model.find_by_code(course_data['courseCode']):
            course_id = course_model.create_course(course_data)
            created_courses.append(course_id)
            print(f"Created course: {course_data['courseCode']} - {course_data['courseName']}")
    
    print(f"Created {len(created_courses)} courses")
    return created_courses

def create_students():
    """Create sample students"""
    print("Creating students...")
    
    user_model = User()
    
    students_data = [
        {
            'username': 'student1',
            'email': 'student1@college.edu',
            'password': 'student123',
            'profile': {
                'firstName': 'Aarav',
                'lastName': 'Sharma',
                'rollNumber': '21CSE001',
                'year': 2021,
                'semester': 6,
                'phone': '+91-9876543201',
                'address': {
                    'street': 'MG Road',
                    'city': 'Bangalore',
                    'state': 'Karnataka',
                    'pincode': '560001'
                }
            }
        },
        {
            'username': 'student2',
            'email': 'student2@college.edu',
            'password': 'student123',
            'profile': {
                'firstName': 'Diya',
                'lastName': 'Patel',
                'rollNumber': '21CSE002',
                'year': 2021,
                'semester': 6,
                'phone': '+91-9876543202',
                'address': {
                    'street': 'Brigade Road',
                    'city': 'Bangalore',
                    'state': 'Karnataka',
                    'pincode': '560025'
                }
            }
        },
        {
            'username': 'student3',
            'email': 'student3@college.edu',
            'password': 'student123',
            'profile': {
                'firstName': 'Arjun',
                'lastName': 'Reddy',
                'rollNumber': '21CSE003',
                'year': 2021,
                'semester': 6,
                'phone': '+91-9876543203',
                'address': {
                    'street': 'Koramangala',
                    'city': 'Bangalore',
                    'state': 'Karnataka',
                    'pincode': '560034'
                }
            }
        },
        {
            'username': 'student',
            'email': 'student@college.edu',
            'password': 'student123',
            'profile': {
                'firstName': 'Priya',
                'lastName': 'Singh',
                'rollNumber': '21CSE004',
                'year': 2021,
                'semester': 6,
                'phone': '+91-9876543204',
                'address': {
                    'street': 'Indiranagar',
                    'city': 'Bangalore',
                    'state': 'Karnataka',
                    'pincode': '560038'
                }
            }
        }
    ]
    
    # Add more students for different semesters
    for i in range(5, 31):  # Students 5-30
        students_data.append({
            'username': f'student{i}',
            'email': f'student{i}@college.edu',
            'password': 'student123',
            'profile': {
                'firstName': f'Student{i}',
                'lastName': 'Test',
                'rollNumber': f'21CSE{i:03d}',
                'year': 2021,
                'semester': 6 if i <= 20 else 4,  # Mix of semester 6 and 4 students
                'phone': f'+91-987654{i:04d}',
                'address': {
                    'street': f'Address {i}',
                    'city': 'Bangalore',
                    'state': 'Karnataka',
                    'pincode': '560001'
                }
            }
        })
    
    created_students = []
    for student_data in students_data:
        # Check if student already exists
        if not user_model.find_by_username(student_data['username']):
            student_data['role'] = 'student'
            student_data['profile']['department'] = 'CSE-AIML'
            student_id = user_model.create_user(student_data)
            created_students.append(student_id)
            print(f"Created student: {student_data['profile']['rollNumber']} - {student_data['profile']['firstName']} {student_data['profile']['lastName']}")
    
    print(f"Created {len(created_students)} students")
    return created_students

def create_enrollments():
    """Create sample enrollments"""
    print("Creating enrollments...")
    
    user_model = User()
    course_model = Course()
    enrollment_model = Enrollment()
    
    # Get all students
    students = user_model.collection.find({'role': 'student'})
    
    # Get courses by semester
    semester_courses = {
        1: course_model.get_courses_by_semester(1),
        2: course_model.get_courses_by_semester(2),
        3: course_model.get_courses_by_semester(3),
        4: course_model.get_courses_by_semester(4),
        5: course_model.get_courses_by_semester(5),
        6: course_model.get_courses_by_semester(6)
    }
    
    current_semester = get_semester_from_date()
    academic_year = get_academic_year()
    
    enrollments_created = 0
    
    for student in students:
        student_semester = student['profile']['semester']
        
        # Enroll in current semester courses
        if student_semester in semester_courses:
            for course in semester_courses[student_semester]:
                # Check if already enrolled
                existing_enrollment = enrollment_model.check_enrollment(
                    str(student['_id']), course['id']
                )
                
                if not existing_enrollment:
                    enrollment_data = {
                        'studentId': student['_id'],
                        'courseId': ObjectId(course['id']),
                        'enrollmentDate': datetime.now(),
                        'status': 'enrolled',
                        'semester': current_semester,
                        'academicYear': academic_year
                    }
                    
                    enrollment_model.enroll_student(enrollment_data)
                    enrollments_created += 1
    
    print(f"Created {enrollments_created} enrollments")

def create_timetable():
    """Create sample timetable"""
    print("Creating timetable...")
    
    course_model = Course()
    timetable_model = Timetable()
    
    # Get some courses
    courses = course_model.get_all_courses()[:10]  # First 10 courses
    
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    time_slots = [
        ('09:00', '10:30'),
        ('10:45', '12:15'),
        ('13:15', '14:45'),
        ('15:00', '16:30')
    ]
    
    rooms = ['CS101', 'CS102', 'CS103', 'LAB1', 'LAB2']
    session_types = ['theory', 'lab', 'tutorial']
    
    timetable_entries = []
    
    for i, course in enumerate(courses):
        day = days[i % len(days)]
        start_time, end_time = time_slots[i % len(time_slots)]
        room = rooms[i % len(rooms)]
        session_type = session_types[i % len(session_types)]
        
        timetable_data = {
            'courseId': ObjectId(course['id']),
            'dayOfWeek': day,
            'startTime': start_time,
            'endTime': end_time,
            'roomNumber': room,
            'sessionType': session_type,
            'semester': course['semester']
        }
        
        timetable_model.create_timetable_entry(timetable_data)
        timetable_entries.append(timetable_data)
    
    print(f"Created {len(timetable_entries)} timetable entries")

def create_attendance_records():
    """Create sample attendance records"""
    print("Creating attendance records...")
    
    user_model = User()
    course_model = Course()
    enrollment_model = Enrollment()
    attendance_model = Attendance()
    
    # Get students and their enrollments
    students = list(user_model.collection.find({'role': 'student'}))[:10]  # First 10 students
    
    attendance_records = []
    
    for student in students:
        # Get student's enrolled courses
        enrollments = enrollment_model.get_student_enrollments(str(student['_id']), 'enrolled')
        
        for enrollment in enrollments[:3]:  # First 3 courses per student
            course_id = enrollment['courseId']
            
            # Create attendance for last 30 days
            for days_back in range(1, 31):
                attendance_date = (datetime.now() - timedelta(days=days_back)).date()
                
                # Skip weekends
                if attendance_date.weekday() >= 5:  # Saturday=5, Sunday=6
                    continue
                
                # 85% attendance rate
                import random
                status = 'present' if random.random() < 0.85 else 'absent'
                
                attendance_data = {
                    'studentId': student['_id'],
                    'courseId': ObjectId(course_id),
                    'date': attendance_date,
                    'status': status,
                    'sessionType': 'theory',
                    'markedBy': ObjectId('507f1f77bcf86cd799439011')  # Dummy admin ID
                }
                
                attendance_records.append(attendance_data)
    
    if attendance_records:
        attendance_model.bulk_mark_attendance(attendance_records)
        print(f"Created {len(attendance_records)} attendance records")

def create_scores():
    """Create sample scores"""
    print("Creating scores...")
    
    user_model = User()
    enrollment_model = Enrollment()
    score_model = Score()
    
    students = list(user_model.collection.find({'role': 'student'}))[:10]  # First 10 students
    
    exam_types = ['Internal-1', 'Internal-2', 'Assignment-1', 'Lab-1']
    scores_data = []
    
    for student in students:
        enrollments = enrollment_model.get_student_enrollments(str(student['_id']), 'enrolled')
        
        for enrollment in enrollments[:3]:  # First 3 courses per student
            for exam_type in exam_types:
                import random
                marks = random.randint(60, 95)  # Good students!
                
                score_data = {
                    'studentId': student['_id'],
                    'courseId': ObjectId(enrollment['courseId']),
                    'examType': exam_type,
                    'marks': marks,
                    'maxMarks': 100,
                    'examDate': datetime.now() - timedelta(days=random.randint(1, 60)),
                    'semester': get_semester_from_date()
                }
                
                scores_data.append(score_data)
    
    if scores_data:
        score_model.bulk_add_scores(scores_data)
        print(f"Created {len(scores_data)} score records")

def create_fees():
    """Create sample fee records"""
    print("Creating fee records...")
    
    user_model = User()
    fee_model = Fee()
    
    students = list(user_model.collection.find({'role': 'student'}))
    
    fee_types = [
        {'type': 'Tuition Fee', 'amount': 50000},
        {'type': 'Lab Fee', 'amount': 5000},
        {'type': 'Library Fee', 'amount': 2000},
        {'type': 'Exam Fee', 'amount': 3000}
    ]
    
    academic_year = get_academic_year()
    
    for student in students[:15]:  # First 15 students
        for fee_type in fee_types:
            # Some fees paid, some pending
            import random
            is_paid = random.random() < 0.7  # 70% payment rate
            
            fee_data = {
                'feeType': fee_type['type'],
                'amount': fee_type['amount'],
                'dueDate': datetime.now() + timedelta(days=30),
                'academicYear': academic_year,
                'description': f"{fee_type['type']} for {academic_year}"
            }
            
            fee_id = fee_model.create_fee_record({
                **fee_data,
                'studentId': student['_id']
            })
            
            if is_paid:
                payment_data = {
                    'paymentMethod': 'Online',
                    'transactionId': f'TXN{random.randint(100000, 999999)}',
                    'paymentReference': f'REF{random.randint(100000, 999999)}'
                }
                fee_model.update_payment_status(fee_id, payment_data)
    
    print("Created fee records")

def create_notifications():
    """Create sample notifications"""
    print("Creating notifications...")
    
    notification_model = Notification()
    
    # Create some general notifications
    notifications = [
        {
            'title': 'Welcome to Academic Year 2024-25',
            'message': 'Welcome to the new academic year. Please check your course enrollments and fee status.',
            'category': 'announcement',
            'priority': 'high'
        },
        {
            'title': 'Internal Exam Schedule Released',
            'message': 'The internal examination schedule has been published. Please check the academic calendar.',
            'category': 'exam',
            'priority': 'high'
        },
        {
            'title': 'Library New Books Available',
            'message': 'New books on AI/ML topics have been added to the library. Check them out!',
            'category': 'general',
            'priority': 'normal'
        },
        {
            'title': 'Fee Payment Reminder',
            'message': 'This is a reminder to pay your pending fees before the due date.',
            'category': 'fee',
            'priority': 'high'
        }
    ]
    
    # Send to all students
    for notification in notifications:
        notification_model.send_to_all_students(notification)
    
    print(f"Created {len(notifications)} notifications")

def main():
    """Main function to create all sample data"""
    print("Initializing database...")
    init_db()
    
    print("Creating sample data for College ERP System...")
    print("=" * 50)
    
    try:
        create_admin_users()
        create_courses()
        create_students()
        create_enrollments()
        create_timetable()
        create_attendance_records()
        create_scores()
        create_fees()
        create_notifications()
        
        print("=" * 50)
        print("✅ Sample data created successfully!")
        print("\nTest Credentials:")
        print("Admin - Username: admin, Password: admin123")
        print("Student - Username: student, Password: student123")
        print("(or student1, student2, etc. with same password)")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
