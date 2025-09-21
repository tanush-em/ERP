from datetime import datetime
from bson import ObjectId
from utils.database import get_db
from utils.helpers import serialize_mongo_doc

class Student:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.students  # Renamed from users to students
    
    def create_student(self, student_data):
        """Create a new student"""
        student_data['createdAt'] = datetime.now()
        student_data['updatedAt'] = datetime.now()
        student_data['isActive'] = True
        
        result = self.collection.insert_one(student_data)
        return str(result.inserted_id)
    
    def find_by_id(self, student_id):
        """Find student by ID"""
        student = self.collection.find_one({'_id': ObjectId(student_id), 'isActive': True})
        return serialize_mongo_doc(student)
    
    def find_by_email(self, email):
        """Find student by email"""
        student = self.collection.find_one({'email': email, 'isActive': True})
        return serialize_mongo_doc(student)
    
    def find_by_roll_number(self, roll_number):
        """Find student by roll number"""
        student = self.collection.find_one({'profile.rollNumber': roll_number, 'isActive': True})
        return serialize_mongo_doc(student)
    
    def update_student(self, student_id, update_data):
        """Update student data"""
        update_data['updatedAt'] = datetime.now()
        result = self.collection.update_one(
            {'_id': ObjectId(student_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    def get_all_students(self, page=1, limit=20):
        """Get all students with pagination"""
        skip = (page - 1) * limit
        students = list(self.collection.find(
            {'isActive': True}
        ).skip(skip).limit(limit).sort('profile.firstName', 1))
        
        total = self.collection.count_documents({'isActive': True})
        
        return {
            'students': serialize_mongo_doc(students),
            'total': total,
            'page': page,
            'totalPages': (total + limit - 1) // limit
        }
    
    def get_students_by_semester(self, semester):
        """Get students by semester"""
        students = list(self.collection.find({
            'profile.semester': semester,
            'isActive': True
        }).sort('profile.rollNumber', 1))
        
        return serialize_mongo_doc(students)
    
    def deactivate_student(self, student_id):
        """Deactivate student (soft delete)"""
        result = self.collection.update_one(
            {'_id': ObjectId(student_id)},
            {'$set': {'isActive': False, 'updatedAt': datetime.now()}}
        )
        return result.modified_count > 0
    
    def get_student_stats(self):
        """Get student statistics"""
        pipeline = [
            {'$match': {'isActive': True}},
            {'$group': {
                '_id': '$profile.semester',
                'count': {'$sum': 1}
            }},
            {'$sort': {'_id': 1}}
        ]
        
        stats = list(self.collection.aggregate(pipeline))
        total_students = self.collection.count_documents({'isActive': True})
        
        return {
            'totalStudents': total_students,
            'semesterWise': serialize_mongo_doc(stats)
        }

