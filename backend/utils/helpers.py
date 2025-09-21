from datetime import datetime, timedelta
from bson import ObjectId
import re

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_roll_number(roll_number):
    """Validate roll number format (example: 21CSE001)"""
    pattern = r'^[0-9]{2}CSE[0-9]{3}$'
    return re.match(pattern, roll_number) is not None

def calculate_attendance_percentage(present_days, total_days):
    """Calculate attendance percentage"""
    if total_days == 0:
        return 0
    return round((present_days / total_days) * 100, 2)

def calculate_attendance_percentage(present_classes, total_classes):
    """Calculate attendance percentage"""
    if total_classes == 0:
        return 0.0
    return round((present_classes / total_classes) * 100, 2)

def get_grade_from_marks(marks, max_marks=100):
    """Convert marks to grade"""
    percentage = (marks / max_marks) * 100
    
    if percentage >= 90:
        return 'A+'
    elif percentage >= 80:
        return 'A'
    elif percentage >= 70:
        return 'B+'
    elif percentage >= 60:
        return 'B'
    elif percentage >= 50:
        return 'C+'
    elif percentage >= 40:
        return 'C'
    elif percentage >= 35:
        return 'D'
    else:
        return 'F'

def get_semester_from_date(date=None):
    """Get current semester based on date"""
    if date is None:
        date = datetime.now()
    
    month = date.month
    year = date.year
    
    # Odd semester: July to December
    if month >= 7:
        return f"ODD-{year}"
    # Even semester: January to June
    else:
        return f"EVEN-{year}"

def format_datetime(dt):
    """Format datetime for API responses"""
    if dt:
        return dt.isoformat()
    return None

def serialize_mongo_doc(doc):
    """Convert MongoDB document to JSON serializable format"""
    if doc is None:
        return None
    
    if isinstance(doc, list):
        return [serialize_mongo_doc(item) for item in doc]
    
    if isinstance(doc, dict):
        serialized = {}
        for key, value in doc.items():
            if key == '_id' and isinstance(value, ObjectId):
                serialized['id'] = str(value)
            elif isinstance(value, ObjectId):
                serialized[key] = str(value)
            elif isinstance(value, datetime):
                serialized[key] = format_datetime(value)
            elif isinstance(value, (dict, list)):
                serialized[key] = serialize_mongo_doc(value)
            else:
                serialized[key] = value
        return serialized
    
    return doc

def generate_roll_number(year, count):
    """Generate roll number for new student"""
    return f"{year % 100:02d}CSE{count:03d}"

def get_academic_year():
    """Get current academic year"""
    now = datetime.now()
    if now.month >= 7:  # July onwards is new academic year
        return f"{now.year}-{now.year + 1}"
    else:
        return f"{now.year - 1}-{now.year}"
