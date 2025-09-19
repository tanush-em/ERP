#!/usr/bin/env python3
"""
Student data population script for College ERP System
Populates the database with the provided student list
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

def get_student_data():
    """Return the list of students to be created"""
    return [
        {"regNo": "310622148001", "name": "Aallan Hrithick A.S"},
        {"regNo": "310622148002", "name": "Achyuth Narayanan M"},
        {"regNo": "310622148003", "name": "Alban J"},
        {"regNo": "310622148004", "name": "Archana V C Nair"},
        {"regNo": "310622148005", "name": "Arya S"},
        {"regNo": "310622148006", "name": "Asvika M A"},
        {"regNo": "310622148007", "name": "Bala Shivani P D"},
        {"regNo": "310622148008", "name": "Bharath K"},
        {"regNo": "310622148009", "name": "Deeptha V"},
        {"regNo": "310622148010", "name": "Divyaa B"},
        {"regNo": "310622148011", "name": "Durga L"},
        {"regNo": "310622148012", "name": "Fahmitha Farhana S"},
        {"regNo": "310622148013", "name": "Harini V"},
        {"regNo": "310622148014", "name": "Harsha Varthini S"},
        {"regNo": "310622148015", "name": "Harshita.V"},
        {"regNo": "310622148016", "name": "Jaya Arshin"},
        {"regNo": "310622148017", "name": "Jenilia Gracelyn.S"},
        {"regNo": "310622148018", "name": "Jhaishnavi.S"},
        {"regNo": "310622148019", "name": "B Kaaviya"},
        {"regNo": "310622148020", "name": "Kavitha A"},
        {"regNo": "310622148021", "name": "kaviya RV"},
        {"regNo": "310622148022", "name": "Keerti J"},
        {"regNo": "310622148023", "name": "Manikanda Ganapathi T"},
        {"regNo": "310622108024", "name": "Manoj Ram K"},
        {"regNo": "310622148025", "name": "Manu Savithri V"},
        {"regNo": "310622148026", "name": "Megala P"},
        {"regNo": "310622148027", "name": "Mohammad Mohseen A"},
        {"regNo": "310622148028", "name": "Mohnish K J"},
        {"regNo": "310622148029", "name": "Narendran G T"},
        {"regNo": "310622148030", "name": "Naveen Karthik R"},
        {"regNo": "310622148031", "name": "Poovarasan G"},
        {"regNo": "310622148032", "name": "Rakhesh Krishna P"},
        {"regNo": "310622148033", "name": "Ranjana G"},
        {"regNo": "310622148034", "name": "Rithanya V R"},
        {"regNo": "310622148035", "name": "Rohit.C"},
        {"regNo": "310622148036", "name": "Ruchikaa k"},
        {"regNo": "310622148037", "name": "Sam Jefferson MP"},
        {"regNo": "310622148038", "name": "Saranya K"},
        {"regNo": "310622148039", "name": "Sheshanathan S"},
        {"regNo": "310622148040", "name": "Sneha P M"},
        {"regNo": "310622148041", "name": "Sri Rajarajeswaran B"},
        {"regNo": "310622148042", "name": "Sudipta Sundar"},
        {"regNo": "310622148043", "name": "SUJETH S"},
        {"regNo": "310622148044", "name": "Sundaram R K"},
        {"regNo": "310622148045", "name": "SuprajaVenkatesan"},
        {"regNo": "310622148046", "name": "Tanush T M"},
        {"regNo": "310622148047", "name": "Tejaswini D"},
        {"regNo": "310622148048", "name": "Varun Kumar G S"},
        {"regNo": "310622148049", "name": "Vignesh M"},
        {"regNo": "310622148050", "name": "Vinodhini K"},
        {"regNo": "310622148051", "name": "Vishnu M P"},
        {"regNo": "310622148053", "name": "Vishveswar R"},
        {"regNo": "310622148054", "name": "A Visvesh Sanathan"},
        {"regNo": "310622148055", "name": "Viswa K"},
        {"regNo": "310622148056", "name": "Yukitha K"},
        {"regNo": "310622148301", "name": "Manasesh S"},
        {"regNo": "310622148302", "name": "Mohamed ashif A"},
        {"regNo": "310622148303", "name": "Pranavaa P"},
        {"regNo": "310622148304", "name": "SAIEED MARICHAMY"},
        {"regNo": "310622148305", "name": "Sakthivel A"},
        {"regNo": "310622148306", "name": "VELMURUGAN R"}
    ]

def parse_name(full_name):
    """Parse full name into first and last name"""
    name_parts = full_name.strip().split()
    if len(name_parts) == 1:
        return name_parts[0], ""
    elif len(name_parts) == 2:
        return name_parts[0], name_parts[1]
    else:
        # For names with more than 2 parts, first word is firstName, rest is lastName
        return name_parts[0], " ".join(name_parts[1:])

def determine_semester(reg_no):
    """Determine semester based on registration number pattern"""
    # Extract year from reg number (assuming format: 310622148xxx)
    year_part = reg_no[2:4]  # Get '06' from '310622148xxx'
    
    # Assuming current year is 2024 and students started in 2022 (22 in reg no)
    # Students would be in their 5th semester (3rd year, 1st semester)
    if reg_no.startswith("31062214"):
        return 5  # 3rd year, 1st semester
    elif reg_no.startswith("31062210"):  # Different pattern for one student
        return 5
    else:
        return 5  # Default to 5th semester

def create_admin_user():
    """Ensure admin user exists"""
    print("Checking admin user...")
    
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
                'city': 'Chennai',
                'state': 'Tamil Nadu',
                'pincode': '600001'
            }
        }
    }
    
    admin_id = user_model.create_user(admin_data)
    print(f"Created admin user with ID: {admin_id}")

def create_courses():
    """Create sample courses for CSE-AIML department"""
    print("Creating courses...")
    
    course_model = Course()
    
    courses_data = [
        # Semester 5 courses (current semester for these students)
        {
            'courseCode': 'CSE501',
            'courseName': 'Software Engineering',
            'credits': 4,
            'semester': 5,
            'faculty': 'Dr. Rajesh Kumar',
            'description': 'Software development life cycle, design patterns, and project management'
        },
        {
            'courseCode': 'CSE502',
            'courseName': 'Computer Networks',
            'credits': 4,
            'semester': 5,
            'faculty': 'Dr. Priya Sharma',
            'description': 'Network protocols, OSI model, and network security'
        },
        {
            'courseCode': 'CSE503',
            'courseName': 'Database Management Systems',
            'credits': 4,
            'semester': 5,
            'faculty': 'Dr. Amit Verma',
            'description': 'Database design, SQL, normalization, and transaction management'
        },
        {
            'courseCode': 'AI501',
            'courseName': 'Machine Learning',
            'credits': 4,
            'semester': 5,
            'faculty': 'Dr. Neha Gupta',
            'description': 'Supervised and unsupervised learning algorithms'
        },
        {
            'courseCode': 'AI502',
            'courseName': 'Artificial Intelligence',
            'credits': 4,
            'semester': 5,
            'faculty': 'Dr. Rohit Agarwal',
            'description': 'AI fundamentals, search algorithms, and knowledge representation'
        },
        {
            'courseCode': 'CSE504',
            'courseName': 'Operating Systems',
            'credits': 4,
            'semester': 5,
            'faculty': 'Dr. Meera Patel',
            'description': 'OS concepts, process management, memory management, and file systems'
        },
        
        # Additional courses for other semesters
        {
            'courseCode': 'CSE601',
            'courseName': 'Deep Learning',
            'credits': 4,
            'semester': 6,
            'faculty': 'Dr. Anita Desai',
            'description': 'Neural networks, CNN, RNN, and deep learning frameworks'
        },
        {
            'courseCode': 'CSE602',
            'courseName': 'Natural Language Processing',
            'credits': 4,
            'semester': 6,
            'faculty': 'Dr. Suresh Reddy',
            'description': 'Text processing, sentiment analysis, and language models'
        }
    ]
    
    created_courses = []
    for course_data in courses_data:
        # Check if course already exists
        if not course_model.find_by_code(course_data['courseCode']):
            course_id = course_model.create_course(course_data)
            created_courses.append(course_id)
            print(f"Created course: {course_data['courseCode']} - {course_data['courseName']}")
        else:
            print(f"Course {course_data['courseCode']} already exists, skipping...")
    
    print(f"Created {len(created_courses)} new courses")
    return created_courses

def create_students():
    """Create students from the provided list"""
    print("Creating students...")
    
    user_model = User()
    students_data = get_student_data()
    
    created_students = []
    
    for i, student_info in enumerate(students_data, 1):
        reg_no = student_info['regNo']
        full_name = student_info['name']
        
        # Check if student already exists
        if user_model.find_by_username(reg_no):
            print(f"Student {reg_no} already exists, skipping...")
            continue
        
        first_name, last_name = parse_name(full_name)
        semester = determine_semester(reg_no)
        
        student_data = {
            'username': reg_no,
            'email': f"{reg_no}@gmail.com",
            'password': reg_no,  # Password is the registration number
            'role': 'student',
            'profile': {
                'firstName': first_name,
                'lastName': last_name,
                'rollNumber': reg_no,
                'department': 'CSE-AIML',
                'year': 2022,  # Assuming they joined in 2022 based on reg no
                'semester': semester,
                'phone': f'+91-98765432{i:02d}',  # Generate phone numbers
                'address': {
                    'street': f'Address {i}',
                    'city': 'Chennai',
                    'state': 'Tamil Nadu',
                    'pincode': '600001'
                }
            }
        }
        
        try:
            student_id = user_model.create_user(student_data)
            created_students.append(student_id)
            print(f"Created student: {reg_no} - {first_name} {last_name}")
        except Exception as e:
            print(f"Error creating student {reg_no}: {e}")
    
    print(f"Created {len(created_students)} students")
    return created_students

def create_enrollments():
    """Create enrollments for all students in semester 5 courses"""
    print("Creating enrollments...")
    
    user_model = User()
    course_model = Course()
    enrollment_model = Enrollment()
    
    # Get all students
    students = list(user_model.collection.find({'role': 'student'}))
    
    # Get semester 5 courses (current semester)
    semester_5_courses = course_model.get_courses_by_semester(5)
    
    current_semester = 5  # Current semester
    academic_year = get_academic_year()
    
    enrollments_created = 0
    
    for student in students:
        student_semester = student['profile'].get('semester', 5)
        
        # Enroll all students in semester 5 courses
        if student_semester == 5:
            for course in semester_5_courses:
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

def create_sample_attendance():
    """Create sample attendance records for students"""
    print("Creating sample attendance records...")
    
    user_model = User()
    enrollment_model = Enrollment()
    attendance_model = Attendance()
    
    # Get all students
    students = list(user_model.collection.find({'role': 'student'}))
    
    attendance_records = []
    
    for student in students:
        # Get student's enrolled courses
        enrollments = enrollment_model.get_student_enrollments(str(student['_id']), 'enrolled')
        
        for enrollment in enrollments:
            course_id = enrollment['courseId']
            
            # Create attendance for last 30 days (excluding weekends)
            for days_back in range(1, 31):
                attendance_date = (datetime.now() - timedelta(days=days_back)).date()
                
                # Skip weekends
                if attendance_date.weekday() >= 5:  # Saturday=5, Sunday=6
                    continue
                
                # 80% attendance rate
                import random
                status = 'present' if random.random() < 0.80 else 'absent'
                
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
        # Bulk insert attendance records
        try:
            attendance_model.bulk_mark_attendance(attendance_records)
            print(f"Created {len(attendance_records)} attendance records")
        except Exception as e:
            print(f"Error creating attendance records: {e}")

def create_sample_scores():
    """Create sample score records for students"""
    print("Creating sample scores...")
    
    user_model = User()
    enrollment_model = Enrollment()
    score_model = Score()
    
    students = list(user_model.collection.find({'role': 'student'}))
    
    exam_types = ['Internal-1', 'Internal-2', 'Assignment-1', 'Lab-1', 'Quiz-1']
    scores_data = []
    
    for student in students:
        enrollments = enrollment_model.get_student_enrollments(str(student['_id']), 'enrolled')
        
        for enrollment in enrollments:
            for exam_type in exam_types:
                import random
                # Generate realistic marks (60-95 range for good performance)
                marks = random.randint(60, 95)
                
                score_data = {
                    'studentId': student['_id'],
                    'courseId': ObjectId(enrollment['courseId']),
                    'examType': exam_type,
                    'marks': marks,
                    'maxMarks': 100,
                    'examDate': datetime.now() - timedelta(days=random.randint(1, 60)),
                    'semester': 5
                }
                
                scores_data.append(score_data)
    
    if scores_data:
        try:
            score_model.bulk_add_scores(scores_data)
            print(f"Created {len(scores_data)} score records")
        except Exception as e:
            print(f"Error creating scores: {e}")

def create_sample_fees():
    """Create sample fee records for students"""
    print("Creating fee records...")
    
    user_model = User()
    fee_model = Fee()
    
    students = list(user_model.collection.find({'role': 'student'}))
    
    fee_types = [
        {'type': 'Tuition Fee', 'amount': 75000},
        {'type': 'Lab Fee', 'amount': 8000},
        {'type': 'Library Fee', 'amount': 3000},
        {'type': 'Exam Fee', 'amount': 5000}
    ]
    
    academic_year = get_academic_year()
    
    for student in students:
        for fee_type in fee_types:
            # 60% of fees are paid, 40% are pending
            import random
            is_paid = random.random() < 0.60
            
            fee_data = {
                'feeType': fee_type['type'],
                'amount': fee_type['amount'],
                'dueDate': datetime.now() + timedelta(days=30),
                'academicYear': academic_year,
                'description': f"{fee_type['type']} for {academic_year}"
            }
            
            try:
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
            except Exception as e:
                print(f"Error creating fee record for student {student['profile']['rollNumber']}: {e}")
    
    print("Created fee records for all students")

def create_notifications():
    """Create sample notifications"""
    print("Creating notifications...")
    
    notification_model = Notification()
    
    notifications = [
        {
            'title': 'Welcome to Academic Year 2024-25',
            'message': 'Welcome to the new academic year. Please check your course enrollments and timetable.',
            'category': 'announcement',
            'priority': 'high'
        },
        {
            'title': 'Internal Exam Schedule Released',
            'message': 'The internal examination schedule for Semester 5 has been published. Please check the academic calendar.',
            'category': 'exam',
            'priority': 'high'
        },
        {
            'title': 'Machine Learning Assignment Due',
            'message': 'Your ML assignment is due next week. Please submit it on time.',
            'category': 'assignment',
            'priority': 'normal'
        },
        {
            'title': 'Fee Payment Reminder',
            'message': 'This is a reminder to pay your pending fees before the due date to avoid late fees.',
            'category': 'fee',
            'priority': 'high'
        },
        {
            'title': 'AI Workshop Registration Open',
            'message': 'Registration is now open for the upcoming AI workshop. Limited seats available!',
            'category': 'event',
            'priority': 'normal'
        }
    ]
    
    # Send to all students
    for notification in notifications:
        try:
            notification_model.send_to_all_students(notification)
        except Exception as e:
            print(f"Error creating notification: {e}")
    
    print(f"Created {len(notifications)} notifications")

def main():
    """Main function to populate database with student data"""
    print("Initializing database...")
    init_db()
    
    print("Populating College ERP System with Student Data...")
    print("=" * 60)
    
    try:
        # Create admin user first
        create_admin_user()
        
        # Create courses
        create_courses()
        
        # Create students from the provided list
        create_students()
        
        # Create enrollments for students
        create_enrollments()
        
        # Create sample data for proper ERP functionality
        create_sample_attendance()
        create_sample_scores()
        create_sample_fees()
        create_notifications()
        
        print("=" * 60)
        print("✅ Student data populated successfully!")
        print(f"\nTotal Students Created: {len(get_student_data())}")
        print("\nCredentials:")
        print("Admin - Username: admin, Password: admin123")
        print("Students - Username: <Registration Number>, Password: <Registration Number>")
        print("Example: Username: 310622148001, Password: 310622148001")
        print("Email format: <Registration Number>@gmail.com")
        
    except Exception as e:
        print(f"❌ Error populating student data: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
