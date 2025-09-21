#!/usr/bin/env python3
"""
Script to populate attendance data for September 2025
Creates attendance records for all students with realistic attendance patterns
"""

import os
import sys
import random
from datetime import datetime, date, timedelta
from bson import ObjectId

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.database import get_db, init_db
from models.student import Student
from models.attendance import Attendance
from models.course import Course

# Student data from the provided list
STUDENT_DATA = [
    {"rollNumber": "310622148001", "name": "Aallan Hrithick A.S"},
    {"rollNumber": "310622148002", "name": "Achyuth Narayanan M"},
    {"rollNumber": "310622148003", "name": "Alban J"},
    {"rollNumber": "310622148004", "name": "Archana V C Nair"},
    {"rollNumber": "310622148005", "name": "Arya S"},
    {"rollNumber": "310622148006", "name": "Asvika M A"},
    {"rollNumber": "310622148007", "name": "Bala Shivani P D"},
    {"rollNumber": "310622148008", "name": "Bharath K"},
    {"rollNumber": "310622148009", "name": "Deeptha V"},
    {"rollNumber": "310622148010", "name": "Divyaa B"},
    {"rollNumber": "310622148011", "name": "Durga L"},
    {"rollNumber": "310622148012", "name": "Fahmitha Farhana S"},
    {"rollNumber": "310622148013", "name": "Harini V"},
    {"rollNumber": "310622148014", "name": "Harsha Varthini S"},
    {"rollNumber": "310622148015", "name": "Harshita.V"},
    {"rollNumber": "310622148016", "name": "Jaya Arshin"},
    {"rollNumber": "310622148017", "name": "Jenilia Gracelyn.S"},
    {"rollNumber": "310622148018", "name": "Jhaishnavi.S"},
    {"rollNumber": "310622148019", "name": "B Kaaviya"},
    {"rollNumber": "310622148020", "name": "Kavitha A"},
    {"rollNumber": "310622148021", "name": "kaviya RV"},
    {"rollNumber": "310622148022", "name": "Keerti J"},
    {"rollNumber": "310622148023", "name": "Manikanda Ganapathi T"},
    {"rollNumber": "310622148024", "name": "Manoj Ram K"},
    {"rollNumber": "310622148025", "name": "Manu Savithri V"},
    {"rollNumber": "310622148026", "name": "Megala P"},
    {"rollNumber": "310622148027", "name": "Mohammad Mohseen A"},
    {"rollNumber": "310622148028", "name": "Mohnish K J"},
    {"rollNumber": "310622148029", "name": "Narendran G T"},
    {"rollNumber": "310622148030", "name": "Naveen Karthik R"},
    {"rollNumber": "310622148031", "name": "Poovarasan G"},
    {"rollNumber": "310622148032", "name": "Rakhesh Krishna P"},
    {"rollNumber": "310622148033", "name": "Ranjana G"},
    {"rollNumber": "310622148034", "name": "Rithanya V R"},
    {"rollNumber": "310622148035", "name": "Rohit.C"},
    {"rollNumber": "310622148036", "name": "Ruchikaa k"},
    {"rollNumber": "310622148037", "name": "Sam Jefferson MP"},
    {"rollNumber": "310622148038", "name": "Saranya K"},
    {"rollNumber": "310622148039", "name": "Sheshanathan S"},
    {"rollNumber": "310622148040", "name": "Sneha P M"},
    {"rollNumber": "310622148041", "name": "Sri Rajarajeswaran B"},
    {"rollNumber": "310622148042", "name": "Sudipta Sundar"},
    {"rollNumber": "310622148043", "name": "SUJETH S"},
    {"rollNumber": "310622148044", "name": "Sundaram R K"},
    {"rollNumber": "310622148045", "name": "SuprajaVenkatesan"},
    {"rollNumber": "310622148046", "name": "Tanush T M"},
    {"rollNumber": "310622148047", "name": "Tejaswini D"},
    {"rollNumber": "310622148048", "name": "Varun Kumar G S"},
    {"rollNumber": "310622148049", "name": "Vignesh M"},
    {"rollNumber": "310622148050", "name": "Vinodhini K"},
    {"rollNumber": "310622148051", "name": "Vishnu M P"},
    {"rollNumber": "310622148053", "name": "Vishveswar R"},
    {"rollNumber": "310622148054", "name": "A Visvesh Sanathan"},
    {"rollNumber": "310622148055", "name": "Viswa K"},
    {"rollNumber": "310622148056", "name": "Yukitha K"},
    {"rollNumber": "310622148301", "name": "Manasesh S"},
    {"rollNumber": "310622148302", "name": "Mohamed ashif A"},
    {"rollNumber": "310622148303", "name": "Pranavaa P"},
    {"rollNumber": "310622148304", "name": "SAIEED MARICHAMY"},
    {"rollNumber": "310622148305", "name": "Sakthivel A"},
    {"rollNumber": "310622148306", "name": "VELMURUGAN R"}
]

# Sample courses for the semester
SAMPLE_COURSES = [
    {
        "courseCode": "CS301",
        "courseName": "Data Structures and Algorithms",
        "credits": 4,
        "semester": 3,
        "department": "Computer Science"
    },
    {
        "courseCode": "CS302",
        "courseName": "Database Management Systems",
        "credits": 3,
        "semester": 3,
        "department": "Computer Science"
    },
    {
        "courseCode": "CS303",
        "courseName": "Computer Networks",
        "credits": 3,
        "semester": 3,
        "department": "Computer Science"
    },
    {
        "courseCode": "CS304",
        "courseName": "Software Engineering",
        "credits": 3,
        "semester": 3,
        "department": "Computer Science"
    },
    {
        "courseCode": "CS305",
        "courseName": "Operating Systems",
        "credits": 4,
        "semester": 3,
        "department": "Computer Science"
    }
]

def generate_september_dates():
    """Generate all dates in September 2025"""
    start_date = date(2025, 9, 1)
    end_date = date(2025, 9, 30)
    
    dates = []
    current_date = start_date
    while current_date <= end_date:
        # Skip weekends (Saturday=5, Sunday=6)
        if current_date.weekday() < 5:  # Monday to Friday
            dates.append(current_date)
        current_date += timedelta(days=1)
    
    return dates

def generate_attendance_status(student_roll, date):
    """
    Generate realistic attendance status based on student and date patterns
    """
    # Set random seed based on student roll and date for consistent results
    random.seed(f"{student_roll}{date.strftime('%Y%m%d')}")
    
    # Base attendance probability (85% average)
    base_probability = 0.85
    
    # Adjust probability based on student roll number (some students are more/less regular)
    roll_num = int(student_roll[-3:])  # Last 3 digits
    if roll_num % 10 < 2:  # Some students with lower attendance
        base_probability = 0.70
    elif roll_num % 10 > 8:  # Some students with higher attendance
        base_probability = 0.95
    
    # Adjust for specific dates (lower attendance on Fridays, higher on Mondays)
    if date.weekday() == 4:  # Friday
        base_probability *= 0.9
    elif date.weekday() == 0:  # Monday
        base_probability *= 1.05
    
    # Random attendance decision
    if random.random() < base_probability:
        # Present or late (90% present, 10% late)
        return "present" if random.random() < 0.9 else "late"
    else:
        return "absent"

def create_students():
    """Create student records in the database"""
    print("Creating student records...")
    db = get_db()
    student_model = Student()
    
    created_students = []
    
    for student_info in STUDENT_DATA:
        # Check if student already exists
        existing_student = student_model.find_by_roll_number(student_info["rollNumber"])
        if existing_student:
            print(f"Student {student_info['rollNumber']} already exists")
            print(f"Student object keys: {list(existing_student.keys()) if existing_student else 'None'}")
            # Handle both string and ObjectId formats
            student_id = existing_student.get("_id") or existing_student.get("id")
            if isinstance(student_id, str):
                created_students.append({"id": student_id, "rollNumber": student_info["rollNumber"]})
            else:
                created_students.append({"id": str(student_id), "rollNumber": student_info["rollNumber"]})
            continue
        
        # Split name into first and last name
        name_parts = student_info["name"].strip().split()
        firstName = name_parts[0] if name_parts else ""
        lastName = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
        
        student_data = {
            "email": f"{student_info['rollNumber'].lower()}@college.edu",
            "profile": {
                "firstName": firstName,
                "lastName": lastName,
                "rollNumber": student_info["rollNumber"],
                "semester": 3,  # Assuming 3rd semester
                "department": "Computer Science",
                "phone": f"91{random.randint(9000000000, 9999999999)}",
                "dateOfBirth": datetime(2003, random.randint(1, 12), random.randint(1, 28)),
                "address": {
                    "street": f"Student Address {random.randint(1, 100)}",
                    "city": "Chennai",
                    "state": "Tamil Nadu",
                    "pincode": "600001"
                }
            },
            "academicInfo": {
                "currentSemester": 3,
                "department": "Computer Science",
                "batch": "2024-2025"
            },
            "role": "student"
        }
        
        student_id = student_model.create_student(student_data)
        print(f"Created student: {student_info['name']} ({student_info['rollNumber']})")
        created_students.append({"id": student_id, "rollNumber": student_info["rollNumber"]})
    
    return created_students

def create_courses():
    """Create course records in the database"""
    print("Creating course records...")
    db = get_db()
    course_model = Course()
    
    created_courses = []
    
    for course_info in SAMPLE_COURSES:
        # Check if course already exists
        existing_course = db.courses.find_one({"courseCode": course_info["courseCode"]})
        if existing_course:
            print(f"Course {course_info['courseCode']} already exists")
            created_courses.append({"id": str(existing_course["_id"]), "courseCode": course_info["courseCode"]})
            continue
        
        course_data = {
            "courseCode": course_info["courseCode"],
            "courseName": course_info["courseName"],
            "credits": course_info["credits"],
            "semester": course_info["semester"],
            "department": course_info["department"],
            "description": f"Course description for {course_info['courseName']}",
            "instructor": {
                "name": f"Dr. Professor {course_info['courseCode'][-1]}",
                "email": f"prof{course_info['courseCode'][-1]}@college.edu"
            },
            "schedule": {
                "days": ["Monday", "Wednesday", "Friday"] if course_info["credits"] == 4 else ["Tuesday", "Thursday"],
                "time": "09:00-10:00" if course_info["credits"] == 4 else "10:00-11:00",
                "room": f"Room {course_info['courseCode'][-1]}01"
            },
            "isActive": True
        }
        
        course_id = course_model.create_course(course_data)
        print(f"Created course: {course_info['courseName']} ({course_info['courseCode']})")
        created_courses.append({"id": course_id, "courseCode": course_info["courseCode"]})
    
    return created_courses

def create_attendance_records(students, courses):
    """Create attendance records for September 2025"""
    print("Creating attendance records for September 2025...")
    db = get_db()
    attendance_model = Attendance()
    
    september_dates = generate_september_dates()
    
    # Create a mapping of roll numbers to student IDs
    student_map = {s["rollNumber"]: s["id"] for s in students}
    
    total_records = 0
    
    for date in september_dates:
        print(f"Processing attendance for {date.strftime('%Y-%m-%d')}...")
        
        # For each course
        for course in courses:
            # For each student
            for student_info in STUDENT_DATA:
                student_id = student_map.get(student_info["rollNumber"])
                if not student_id:
                    continue
                
                # Generate attendance status
                status = generate_attendance_status(student_info["rollNumber"], date)
                
                # Create attendance record
                attendance_data = {
                    'studentId': ObjectId(student_id),
                    'courseId': ObjectId(course["id"]),
                    'date': datetime.combine(date, datetime.min.time()),  # Convert date to datetime
                    'status': status,
                    'createdAt': datetime.now(),
                    'updatedAt': datetime.now()
                }
                
                # Insert attendance record
                db.attendance.update_one(
                    {
                        'studentId': ObjectId(student_id),
                        'courseId': ObjectId(course["id"]),
                        'date': datetime.combine(date, datetime.min.time())
                    },
                    {'$set': attendance_data},
                    upsert=True
                )
                
                total_records += 1
    
    print(f"Created {total_records} attendance records for September 2025")
    return total_records

def generate_attendance_statistics():
    """Generate and display attendance statistics"""
    print("\nGenerating attendance statistics...")
    db = get_db()
    
    # Get overall statistics
    total_records = db.attendance.count_documents({})
    present_records = db.attendance.count_documents({"status": {"$in": ["present", "late"]}})
    absent_records = db.attendance.count_documents({"status": "absent"})
    
    overall_percentage = (present_records / total_records * 100) if total_records > 0 else 0
    
    print(f"\n=== September 2025 Attendance Statistics ===")
    print(f"Total attendance records: {total_records}")
    print(f"Present/Late: {present_records}")
    print(f"Absent: {absent_records}")
    print(f"Overall attendance percentage: {overall_percentage:.2f}%")
    
    # Get statistics by course
    print(f"\n=== Attendance by Course ===")
    pipeline = [
        {"$lookup": {
            "from": "courses",
            "localField": "courseId",
            "foreignField": "_id",
            "as": "course"
        }},
        {"$unwind": "$course"},
        {"$group": {
            "_id": {
                "courseCode": "$course.courseCode",
                "courseName": "$course.courseName"
            },
            "total": {"$sum": 1},
            "present": {"$sum": {"$cond": [{"$in": ["$status", ["present", "late"]]}, 1, 0]}}
        }},
        {"$addFields": {
            "percentage": {"$multiply": [{"$divide": ["$present", "$total"]}, 100]}
        }},
        {"$sort": {"_id.courseCode": 1}}
    ]
    
    course_stats = list(db.attendance.aggregate(pipeline))
    for stat in course_stats:
        print(f"{stat['_id']['courseCode']} ({stat['_id']['courseName']}): {stat['percentage']:.2f}%")
    
    # Get low attendance students
    print(f"\n=== Students with Low Attendance (<75%) ===")
    pipeline = [
        {"$lookup": {
            "from": "students",
            "localField": "studentId",
            "foreignField": "_id",
            "as": "student"
        }},
        {"$unwind": "$student"},
        {"$group": {
            "_id": {
                "studentId": "$studentId",
                "rollNumber": "$student.profile.rollNumber",
                "name": {"$concat": ["$student.profile.firstName", " ", "$student.profile.lastName"]}
            },
            "total": {"$sum": 1},
            "present": {"$sum": {"$cond": [{"$in": ["$status", ["present", "late"]]}, 1, 0]}}
        }},
        {"$addFields": {
            "percentage": {"$multiply": [{"$divide": ["$present", "$total"]}, 100]}
        }},
        {"$match": {"percentage": {"$lt": 75}}},
        {"$sort": {"percentage": 1}}
    ]
    
    low_attendance = list(db.attendance.aggregate(pipeline))
    for student in low_attendance[:10]:  # Show top 10
        print(f"{student['_id']['rollNumber']} - {student['_id']['name']}: {student['percentage']:.2f}%")

def main():
    """Main function to populate attendance data"""
    print("Starting September 2025 attendance data population...")
    
    try:
        # Initialize database connection
        init_db()
        
        # Create students
        students = create_students()
        
        # Create courses
        courses = create_courses()
        
        # Create attendance records
        total_records = create_attendance_records(students, courses)
        
        # Generate statistics
        generate_attendance_statistics()
        
        print(f"\n✅ Successfully populated attendance data!")
        print(f"📊 Created {len(students)} students")
        print(f"📚 Created {len(courses)} courses")
        print(f"📅 Created {total_records} attendance records for September 2025")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
