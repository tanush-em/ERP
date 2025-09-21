#!/usr/bin/env python3
"""
Script to populate the database with dummy data for all models
according to the new schema specifications.
"""

import sys
import os
from datetime import datetime, timedelta
import random

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.attendance import Attendance
from models.leave import Leave
from models.course import Course
from models.timetable import Timetable
from models.notification import Notification

def populate_attendance_data():
    """Populate attendance data with roll_no, name, and array of 30 attendance values"""
    print("Populating attendance data...")
    attendance_model = Attendance()
    
    # Sample student data
    students = [
        {"roll_no": "2024001", "name": "Alice Johnson"},
        {"roll_no": "2024002", "name": "Bob Smith"},
        {"roll_no": "2024003", "name": "Carol Davis"},
        {"roll_no": "2024004", "name": "David Wilson"},
        {"roll_no": "2024005", "name": "Emma Brown"},
        {"roll_no": "2024006", "name": "Frank Miller"},
        {"roll_no": "2024007", "name": "Grace Lee"},
        {"roll_no": "2024008", "name": "Henry Taylor"},
        {"roll_no": "2024009", "name": "Ivy Chen"},
        {"roll_no": "2024010", "name": "Jack Anderson"},
        {"roll_no": "2024011", "name": "Kate Martinez"},
        {"roll_no": "2024012", "name": "Liam Thompson"},
        {"roll_no": "2024013", "name": "Maya Garcia"},
        {"roll_no": "2024014", "name": "Noah Rodriguez"},
        {"roll_no": "2024015", "name": "Olivia White"}
    ]
    
    attendance_records = []
    for student in students:
        # Generate random attendance array (0=absent, 1=present)
        # Most students have 80-95% attendance
        attendance_array = []
        attendance_rate = random.uniform(0.8, 0.95)
        
        for day in range(30):
            if random.random() < attendance_rate:
                attendance_array.append(1)  # Present
            else:
                attendance_array.append(0)  # Absent
        
        attendance_records.append({
            "roll_no": student["roll_no"],
            "name": student["name"],
            "attendance": attendance_array
        })
    
    result = attendance_model.bulk_create_attendance(attendance_records)
    print(f"Created {result} attendance records")

def populate_leave_data():
    """Populate leave data with roll_no, name, date_of_leave, reason, status"""
    print("Populating leave data...")
    leave_model = Leave()
    
    # Sample leave reasons
    reasons = [
        "Medical emergency",
        "Family function",
        "Personal work",
        "Health checkup",
        "Wedding",
        "Festival",
        "Academic conference",
        "Sports event",
        "Family emergency",
        "Personal reasons"
    ]
    
    statuses = ["pending", "approved", "rejected"]
    
    # Generate leave requests for different students
    roll_numbers = [f"2024{i:03d}" for i in range(1, 16)]
    
    for i in range(50):  # Create 50 leave requests
        roll_no = random.choice(roll_numbers)
        name = f"Student {roll_no[-3:]}"
        date_of_leave = datetime.now() + timedelta(days=random.randint(-30, 30))
        reason = random.choice(reasons)
        status = random.choice(statuses)
        
        leave_model.create_leave_request(roll_no, name, date_of_leave, reason, status)
    
    print("Created 50 leave requests")

def populate_course_data():
    """Populate course data with course_name and handling_faculty"""
    print("Populating course data...")
    course_model = Course()
    
    courses = [
        {"course_name": "Data Structures and Algorithms", "handling_faculty": "Dr. Sarah Wilson"},
        {"course_name": "Database Management Systems", "handling_faculty": "Prof. Michael Brown"},
        {"course_name": "Computer Networks", "handling_faculty": "Dr. Jennifer Davis"},
        {"course_name": "Software Engineering", "handling_faculty": "Prof. Robert Johnson"},
        {"course_name": "Machine Learning", "handling_faculty": "Dr. Emily Chen"},
        {"course_name": "Web Development", "handling_faculty": "Prof. David Miller"},
        {"course_name": "Operating Systems", "handling_faculty": "Dr. Lisa Anderson"},
        {"course_name": "Artificial Intelligence", "handling_faculty": "Prof. James Taylor"},
        {"course_name": "Computer Graphics", "handling_faculty": "Dr. Maria Garcia"},
        {"course_name": "Cybersecurity", "handling_faculty": "Prof. Kevin Lee"},
        {"course_name": "Mobile App Development", "handling_faculty": "Dr. Rachel White"},
        {"course_name": "Cloud Computing", "handling_faculty": "Prof. Daniel Martinez"},
        {"course_name": "Data Science", "handling_faculty": "Dr. Amanda Rodriguez"},
        {"course_name": "Human-Computer Interaction", "handling_faculty": "Prof. Christopher Thompson"},
        {"course_name": "Information Systems", "handling_faculty": "Dr. Stephanie Wilson"}
    ]
    
    for course in courses:
        course_model.create_course(course["course_name"], course["handling_faculty"])
    
    print(f"Created {len(courses)} courses")

def populate_timetable_data():
    """Populate timetable data with day, period, course_name, duration"""
    print("Populating timetable data...")
    timetable_model = Timetable()
    
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    periods = ["Period 1", "Period 2", "Period 3", "Period 4", "Period 5", "Period 6", "Period 7"]
    durations = ["50 minutes", "60 minutes", "45 minutes", "90 minutes"]
    
    # Sample courses
    courses = [
        "Data Structures and Algorithms",
        "Database Management Systems", 
        "Computer Networks",
        "Software Engineering",
        "Machine Learning",
        "Web Development",
        "Operating Systems",
        "Artificial Intelligence"
    ]
    
    # Create timetable entries for each day and period
    for day in days:
        for period in periods:
            if random.random() > 0.3:  # 70% chance of having a class
                course_name = random.choice(courses)
                duration = random.choice(durations)
                timetable_model.create_entry(day, period, course_name, duration)
    
    print("Created timetable entries")

def populate_notification_data():
    """Populate notification data with title, content, priority, author, due_date"""
    print("Populating notification data...")
    notification_model = Notification()
    
    notifications = [
        {
            "title": "Midterm Exam Schedule",
            "content": "Midterm exams will be conducted from March 15-25, 2024. Please check the detailed schedule on the notice board.",
            "priority": "high",
            "author": "Academic Office",
            "due_date": datetime.now() + timedelta(days=7)
        },
        {
            "title": "Library Maintenance",
            "content": "The library will be closed for maintenance from March 10-12, 2024. Please plan accordingly.",
            "priority": "medium",
            "author": "Library Department",
            "due_date": datetime.now() + timedelta(days=3)
        },
        {
            "title": "Project Submission Deadline",
            "content": "Final year project submissions are due by March 30, 2024. Late submissions will not be accepted.",
            "priority": "urgent",
            "author": "Project Coordinator",
            "due_date": datetime.now() + timedelta(days=14)
        },
        {
            "title": "Sports Day Event",
            "content": "Annual sports day will be held on March 20, 2024. Students are encouraged to participate.",
            "priority": "low",
            "author": "Sports Committee",
            "due_date": datetime.now() + timedelta(days=10)
        },
        {
            "title": "Course Registration Open",
            "content": "Online course registration for next semester is now open. Please register by March 15, 2024.",
            "priority": "medium",
            "author": "Registration Office",
            "due_date": datetime.now() + timedelta(days=5)
        },
        {
            "title": "Fee Payment Reminder",
            "content": "Last date for fee payment is March 25, 2024. Students with pending fees will not be allowed to attend classes.",
            "priority": "high",
            "author": "Accounts Department",
            "due_date": datetime.now() + timedelta(days=12)
        },
        {
            "title": "Workshop on AI/ML",
            "content": "Two-day workshop on Artificial Intelligence and Machine Learning will be conducted on March 18-19, 2024.",
            "priority": "medium",
            "author": "Computer Science Department",
            "due_date": datetime.now() + timedelta(days=8)
        },
        {
            "title": "Hostel Rules Update",
            "content": "New hostel rules and regulations have been updated. Please read the updated guidelines.",
            "priority": "low",
            "author": "Hostel Administration",
            "due_date": datetime.now() + timedelta(days=6)
        },
        {
            "title": "Career Fair 2024",
            "content": "Annual career fair will be held on March 22, 2024. Companies from various sectors will participate.",
            "priority": "high",
            "author": "Placement Cell",
            "due_date": datetime.now() + timedelta(days=11)
        },
        {
            "title": "Scholarship Application",
            "content": "Applications for merit-based scholarships are now open. Last date to apply is March 28, 2024.",
            "priority": "medium",
            "author": "Scholarship Committee",
            "due_date": datetime.now() + timedelta(days=15)
        }
    ]
    
    for notification in notifications:
        notification_model.create_notification(
            notification["title"],
            notification["content"],
            notification["priority"],
            notification["author"],
            notification["due_date"]
        )
    
    print(f"Created {len(notifications)} notifications")

def main():
    """Main function to populate all data"""
    print("Starting database population with dummy data...")
    print("=" * 50)
    
    try:
        populate_attendance_data()
        print()
        
        populate_leave_data()
        print()
        
        populate_course_data()
        print()
        
        populate_timetable_data()
        print()
        
        populate_notification_data()
        print()
        
        print("=" * 50)
        print("✅ Database population completed successfully!")
        print("\nSummary:")
        print("- Attendance: 15 student records with 30-day attendance arrays")
        print("- Leave: 50 leave requests with various statuses")
        print("- Courses: 15 courses with handling faculty")
        print("- Timetable: Multiple entries across days and periods")
        print("- Notifications: 10 notifications with different priorities")
        
    except Exception as e:
        print(f"❌ Error during database population: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
