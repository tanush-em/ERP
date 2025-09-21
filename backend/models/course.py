from datetime import datetime
from bson import ObjectId
from utils.database import get_db
from utils.helpers import serialize_mongo_doc

class Course:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.courses
    
    def create_course(self, course_name, handling_faculty):
        """Create a new course"""
        course_data = {
            'course_name': course_name,
            'handling_faculty': handling_faculty,
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
        
        result = self.collection.insert_one(course_data)
        return str(result.inserted_id)
    
    def find_by_id(self, course_id):
        """Find course by ID"""
        course = self.collection.find_one({'_id': ObjectId(course_id)})
        return serialize_mongo_doc(course)
    
    def find_by_name(self, course_name):
        """Find course by course name"""
        course = self.collection.find_one({'course_name': course_name})
        return serialize_mongo_doc(course)
    
    def get_all_courses(self):
        """Get all courses"""
        courses = list(self.collection.find().sort('course_name', 1))
        return serialize_mongo_doc(courses)
    
    def get_courses_by_faculty(self, handling_faculty):
        """Get courses by handling faculty"""
        courses = list(self.collection.find({'handling_faculty': handling_faculty}).sort('course_name', 1))
        return serialize_mongo_doc(courses)
    
    def update_course(self, course_id, course_name=None, handling_faculty=None):
        """Update course data"""
        update_data = {'updatedAt': datetime.now()}
        
        if course_name:
            update_data['course_name'] = course_name
        if handling_faculty:
            update_data['handling_faculty'] = handling_faculty
        
        result = self.collection.update_one(
            {'_id': ObjectId(course_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    def delete_course(self, course_id):
        """Delete course"""
        result = self.collection.delete_one({'_id': ObjectId(course_id)})
        return result.deleted_count > 0
    
    def get_course_stats(self):
        """Get course statistics"""
        total_courses = self.collection.count_documents({})
        
        # Faculty-wise course count
        pipeline = [
            {'$group': {
                '_id': '$handling_faculty',
                'count': {'$sum': 1}
            }},
            {'$sort': {'count': -1}}
        ]
        
        faculty_stats = list(self.collection.aggregate(pipeline))
        
        return {
            'total_courses': total_courses,
            'faculty_wise': serialize_mongo_doc(faculty_stats)
        }
    
    def search_courses(self, query):
        """Search courses by name or faculty"""
        search_filter = {
            '$or': [
                {'course_name': {'$regex': query, '$options': 'i'}},
                {'handling_faculty': {'$regex': query, '$options': 'i'}}
            ]
        }
        
        courses = list(self.collection.find(search_filter).sort('course_name', 1))
        return serialize_mongo_doc(courses)
