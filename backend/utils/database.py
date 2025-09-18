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
    
    # User indexes
    db.users.create_index("username", unique=True)
    db.users.create_index("email", unique=True)
    db.users.create_index("profile.rollNumber", unique=True, sparse=True)
    
    # Course indexes
    db.courses.create_index("courseCode", unique=True)
    db.courses.create_index([("semester", 1), ("isActive", 1)])
    
    # Enrollment indexes
    db.enrollments.create_index([("studentId", 1), ("courseId", 1)], unique=True)
    db.enrollments.create_index("studentId")
    db.enrollments.create_index("courseId")
    
    # Attendance indexes
    db.attendance.create_index([("studentId", 1), ("courseId", 1), ("date", 1)], unique=True)
    db.attendance.create_index("studentId")
    db.attendance.create_index("courseId")
    db.attendance.create_index("date")
    
    # Score indexes
    db.scores.create_index([("studentId", 1), ("courseId", 1), ("examType", 1)])
    db.scores.create_index("studentId")
    
    # Notification indexes
    db.notifications.create_index("userId")
    db.notifications.create_index([("userId", 1), ("isRead", 1)])
    
    print("✅ Database indexes created successfully!")
