from datetime import datetime
from bson import ObjectId
from utils.database import get_db
from utils.helpers import hash_password, verify_password, serialize_mongo_doc

class User:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.users
    
    def create_user(self, user_data):
        """Create a new user"""
        # Hash password before storing
        user_data['password'] = hash_password(user_data['password'])
        user_data['createdAt'] = datetime.now()
        user_data['updatedAt'] = datetime.now()
        user_data['isActive'] = True
        
        result = self.collection.insert_one(user_data)
        return str(result.inserted_id)
    
    def find_by_username(self, username):
        """Find user by username"""
        user = self.collection.find_one({'username': username, 'isActive': True})
        return serialize_mongo_doc(user)
    
    def find_by_id(self, user_id):
        """Find user by ID"""
        user = self.collection.find_one({'_id': ObjectId(user_id), 'isActive': True})
        return serialize_mongo_doc(user)
    
    def find_by_email(self, email):
        """Find user by email"""
        user = self.collection.find_one({'email': email, 'isActive': True})
        return serialize_mongo_doc(user)
    
    def verify_password(self, user, password):
        """Verify user password"""
        return verify_password(password, user['password'])
    
    def update_user(self, user_id, update_data):
        """Update user data"""
        update_data['updatedAt'] = datetime.now()
        result = self.collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    def get_all_students(self, page=1, limit=20):
        """Get all students with pagination"""
        skip = (page - 1) * limit
        students = list(self.collection.find(
            {'role': 'student', 'isActive': True}
        ).skip(skip).limit(limit).sort('profile.firstName', 1))
        
        total = self.collection.count_documents({'role': 'student', 'isActive': True})
        
        return {
            'students': serialize_mongo_doc(students),
            'total': total,
            'page': page,
            'totalPages': (total + limit - 1) // limit
        }
    
    def get_students_by_semester(self, semester):
        """Get students by semester"""
        students = list(self.collection.find({
            'role': 'student',
            'profile.semester': semester,
            'isActive': True
        }).sort('profile.rollNumber', 1))
        
        return serialize_mongo_doc(students)
    
    def deactivate_user(self, user_id):
        """Deactivate user (soft delete)"""
        result = self.collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'isActive': False, 'updatedAt': datetime.now()}}
        )
        return result.modified_count > 0
    
    def get_student_stats(self):
        """Get student statistics"""
        pipeline = [
            {'$match': {'role': 'student', 'isActive': True}},
            {'$group': {
                '_id': '$profile.semester',
                'count': {'$sum': 1}
            }},
            {'$sort': {'_id': 1}}
        ]
        
        stats = list(self.collection.aggregate(pipeline))
        total_students = self.collection.count_documents({'role': 'student', 'isActive': True})
        
        return {
            'totalStudents': total_students,
            'semesterWise': serialize_mongo_doc(stats)
        }
