from datetime import datetime, timedelta
from bson import ObjectId
from pymongo import UpdateOne
from utils.database import get_db
from utils.helpers import serialize_mongo_doc, calculate_attendance_percentage

class Attendance:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.attendance
    
    def create_monthly_attendance(self, roll_no, name, attendance_array):
        """Create monthly attendance record with roll_no, name, and array of 30 attendance values"""
        attendance_data = {
            'roll_no': roll_no,
            'name': name,
            'attendance': attendance_array,  # Array of 30 int (0=absent, 1=present)
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
        
        result = self.collection.insert_one(attendance_data)
        return str(result.inserted_id)
    
    def update_attendance(self, roll_no, attendance_array):
        """Update attendance array for a student"""
        result = self.collection.update_one(
            {'roll_no': roll_no},
            {
                '$set': {
                    'attendance': attendance_array,
                    'updatedAt': datetime.now()
                }
            }
        )
        return result.modified_count > 0
    
    def mark_daily_attendance(self, roll_no, day_index, status):
        """Mark attendance for a specific day (0-29 for 30 days)"""
        if day_index < 0 or day_index >= 30:
            return False
            
        result = self.collection.update_one(
            {'roll_no': roll_no},
            {
                '$set': {
                    f'attendance.{day_index}': 1 if status else 0,
                    'updatedAt': datetime.now()
                }
            }
        )
        return result.modified_count > 0
    
    def get_all_attendance_records(self):
        """Get all attendance records"""
        records = list(self.collection.find().sort('roll_no', 1))
        return serialize_mongo_doc(records)
    
    def get_attendance_by_roll_no(self, roll_no):
        """Get attendance record by roll number"""
        record = self.collection.find_one({'roll_no': roll_no})
        return serialize_mongo_doc(record)
    
    def get_attendance_by_name(self, name):
        """Get attendance record by name"""
        records = list(self.collection.find({'name': {'$regex': name, '$options': 'i'}}))
        return serialize_mongo_doc(records)
    
    def bulk_create_attendance(self, attendance_records):
        """Bulk create attendance records for multiple students"""
        for record in attendance_records:
            record['createdAt'] = datetime.now()
            record['updatedAt'] = datetime.now()
        
        if attendance_records:
            result = self.collection.insert_many(attendance_records)
            return len(result.inserted_ids)
        return 0
    
    def calculate_attendance_percentage(self, roll_no):
        """Calculate attendance percentage for a student"""
        record = self.collection.find_one({'roll_no': roll_no})
        if not record or not record.get('attendance'):
            return 0
        
        attendance_array = record['attendance']
        present_days = sum(attendance_array)
        total_days = len(attendance_array)
        
        if total_days == 0:
            return 0
        
        return round((present_days / total_days) * 100, 2)
    
    def get_low_attendance_students(self, threshold=75):
        """Get students with attendance below threshold"""
        records = list(self.collection.find())
        low_attendance_students = []
        
        for record in records:
            percentage = self.calculate_attendance_percentage(record['roll_no'])
            if percentage < threshold:
                low_attendance_students.append({
                    'roll_no': record['roll_no'],
                    'name': record['name'],
                    'attendance_percentage': percentage
                })
        
        return serialize_mongo_doc(low_attendance_students)
