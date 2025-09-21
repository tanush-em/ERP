from datetime import datetime
from bson import ObjectId
from utils.database import get_db
from utils.helpers import serialize_mongo_doc

class Course:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.courses
    
    def create_course(self, course_data):
        """Create a new course"""
        course_data['createdAt'] = datetime.now()
        course_data['updatedAt'] = datetime.now()
        course_data['isActive'] = True
        
        result = self.collection.insert_one(course_data)
        return str(result.inserted_id)
    
    def find_by_id(self, course_id):
        """Find course by ID"""
        course = self.collection.find_one({'_id': ObjectId(course_id), 'isActive': True})
        return serialize_mongo_doc(course)
    
    def find_by_code(self, course_code):
        """Find course by course code"""
        course = self.collection.find_one({'courseCode': course_code, 'isActive': True})
        return serialize_mongo_doc(course)
    
    def get_all_courses(self):
        """Get all active courses"""
        courses = list(self.collection.find({'isActive': True}).sort('courseCode', 1))
        return serialize_mongo_doc(courses)
    
    def get_courses_by_semester(self, semester):
        """Get courses by semester"""
        courses = list(self.collection.find({
            'semester': semester,
            'isActive': True
        }).sort('courseCode', 1))
        return serialize_mongo_doc(courses)
    
    def update_course(self, course_id, update_data):
        """Update course data"""
        update_data['updatedAt'] = datetime.now()
        result = self.collection.update_one(
            {'_id': ObjectId(course_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    def delete_course(self, course_id):
        """Delete course (soft delete)"""
        result = self.collection.update_one(
            {'_id': ObjectId(course_id)},
            {'$set': {'isActive': False, 'updatedAt': datetime.now()}}
        )
        return result.modified_count > 0
    
    def get_course_stats(self):
        """Get course statistics"""
        total_courses = self.collection.count_documents({'isActive': True})
        
        # Semester-wise course count
        pipeline = [
            {'$match': {'isActive': True}},
            {'$group': {
                '_id': '$semester',
                'count': {'$sum': 1},
                'totalCredits': {'$sum': '$credits'}
            }},
            {'$sort': {'_id': 1}}
        ]
        
        semester_stats = list(self.collection.aggregate(pipeline))
        
        return {
            'totalCourses': total_courses,
            'semesterWise': serialize_mongo_doc(semester_stats)
        }
    
    def search_courses(self, query):
        """Search courses by name or code"""
        search_filter = {
            '$or': [
                {'courseName': {'$regex': query, '$options': 'i'}},
                {'courseCode': {'$regex': query, '$options': 'i'}},
                {'faculty': {'$regex': query, '$options': 'i'}}
            ],
            'isActive': True
        }
        
        courses = list(self.collection.find(search_filter).sort('courseCode', 1))
        return serialize_mongo_doc(courses)
