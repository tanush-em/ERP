from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
from config import Config

# Global database connection
db = None
client = None

def init_db():
    """Initialize MongoDB connection"""
    global db, client
    try:
        client = MongoClient(Config.MONGO_URI)
        # Test the connection
        client.admin.command('ping')
        db = client.college_erp
        print("✅ Connected to MongoDB successfully!")
        
        # Create indexes for better performance
        create_indexes()
        
    except ConnectionFailure as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        raise

def get_db():
    """Get database instance"""
    global db
    if db is None:
        init_db()
    return db

def create_indexes():
    """Create database indexes for better performance"""
    db = get_db()
    
    # User indexes (keeping existing for compatibility)
    try:
        db.users.create_index("username", unique=True)
        db.users.create_index("email", unique=True)
        db.users.create_index("profile.rollNumber", unique=True, sparse=True)
    except:
        pass
    
    # New schema indexes
    
    # Attendance indexes - roll_no should be unique
    db.attendance.create_index("roll_no", unique=True)
    db.attendance.create_index("name")
    
    # Leave indexes
    db.leave.create_index("roll_no")
    db.leave.create_index("status")
    db.leave.create_index("date_of_leave")
    
    # Course indexes - course_name should be unique
    db.courses.create_index("course_name", unique=True)
    db.courses.create_index("handling_faculty")
    
    # Timetable indexes
    db.timetable.create_index([("day", 1), ("period", 1)])
    db.timetable.create_index("course_name")
    
    # Notification indexes
    db.notification.create_index("priority")
    db.notification.create_index("author")
    db.notification.create_index("due_date")
    
    print("✅ Database indexes created successfully!")
