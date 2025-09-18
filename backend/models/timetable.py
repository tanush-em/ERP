from datetime import datetime
from bson import ObjectId
from utils.database import get_db
from utils.helpers import serialize_mongo_doc

class Timetable:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.timetables
    
    def create_timetable_entry(self, timetable_data):
        """Create a new timetable entry"""
        timetable_data['createdAt'] = datetime.now()
        timetable_data['updatedAt'] = datetime.now()
        
        result = self.collection.insert_one(timetable_data)
        return str(result.inserted_id)
    
    def get_student_timetable(self, student_id, semester):
        """Get timetable for a student based on enrolled courses"""
        # Get student's enrolled courses
        enrolled_courses = list(self.db.enrollments.find({
            'studentId': ObjectId(student_id),
            'semester': semester,
            'status': 'enrolled'
        }))
        
        course_ids = [enrollment['courseId'] for enrollment in enrolled_courses]
        
        # Get timetable entries for these courses
        timetable = list(self.collection.find({
            'courseId': {'$in': course_ids},
            'semester': semester
        }).sort([('dayOfWeek', 1), ('startTime', 1)]))
        
        # Populate course details
        for entry in timetable:
            course = self.db.courses.find_one({'_id': entry['courseId']})
            entry['course'] = course
        
        return serialize_mongo_doc(timetable)
    
    def get_course_timetable(self, course_id):
        """Get timetable for a specific course"""
        timetable = list(self.collection.find({
            'courseId': ObjectId(course_id)
        }).sort([('dayOfWeek', 1), ('startTime', 1)]))
        
        # Populate course details
        for entry in timetable:
            course = self.db.courses.find_one({'_id': entry['courseId']})
            entry['course'] = course
        
        return serialize_mongo_doc(timetable)
    
    def get_semester_timetable(self, semester):
        """Get complete timetable for a semester"""
        timetable = list(self.collection.find({
            'semester': semester
        }).sort([('dayOfWeek', 1), ('startTime', 1)]))
        
        # Populate course details
        for entry in timetable:
            course = self.db.courses.find_one({'_id': entry['courseId']})
            entry['course'] = course
        
        return serialize_mongo_doc(timetable)
    
    def update_timetable_entry(self, entry_id, update_data):
        """Update a timetable entry"""
        update_data['updatedAt'] = datetime.now()
        
        result = self.collection.update_one(
            {'_id': ObjectId(entry_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    def delete_timetable_entry(self, entry_id):
        """Delete a timetable entry"""
        result = self.collection.delete_one({'_id': ObjectId(entry_id)})
        return result.deleted_count > 0
    
    def get_room_schedule(self, room_number, day=None):
        """Get schedule for a specific room"""
        filter_query = {'roomNumber': room_number}
        
        if day:
            filter_query['dayOfWeek'] = day
        
        schedule = list(self.collection.find(filter_query).sort('startTime', 1))
        
        # Populate course details
        for entry in schedule:
            course = self.db.courses.find_one({'_id': entry['courseId']})
            entry['course'] = course
        
        return serialize_mongo_doc(schedule)
    
    def get_faculty_schedule(self, faculty_name, day=None):
        """Get schedule for a faculty member"""
        # First get courses taught by this faculty
        courses = list(self.db.courses.find({'faculty': faculty_name}))
        course_ids = [course['_id'] for course in courses]
        
        filter_query = {'courseId': {'$in': course_ids}}
        
        if day:
            filter_query['dayOfWeek'] = day
        
        schedule = list(self.collection.find(filter_query).sort([('dayOfWeek', 1), ('startTime', 1)]))
        
        # Populate course details
        for entry in schedule:
            course = self.db.courses.find_one({'_id': entry['courseId']})
            entry['course'] = course
        
        return serialize_mongo_doc(schedule)
    
    def check_time_conflict(self, course_id, day_of_week, start_time, end_time, room_number=None, exclude_id=None):
        """Check for time conflicts in timetable"""
        filter_query = {
            'dayOfWeek': day_of_week,
            '$or': [
                {
                    'startTime': {'$lt': end_time},
                    'endTime': {'$gt': start_time}
                }
            ]
        }
        
        # Check room conflict
        if room_number:
            filter_query['roomNumber'] = room_number
        
        # Exclude current entry when updating
        if exclude_id:
            filter_query['_id'] = {'$ne': ObjectId(exclude_id)}
        
        conflicts = list(self.collection.find(filter_query))
        return serialize_mongo_doc(conflicts)
    
    def get_weekly_schedule(self, semester):
        """Get organized weekly schedule for a semester"""
        timetable = list(self.collection.find({
            'semester': semester
        }).sort([('dayOfWeek', 1), ('startTime', 1)]))
        
        # Organize by day of week
        weekly_schedule = {
            'Monday': [],
            'Tuesday': [],
            'Wednesday': [],
            'Thursday': [],
            'Friday': [],
            'Saturday': []
        }
        
        for entry in timetable:
            course = self.db.courses.find_one({'_id': entry['courseId']})
            entry['course'] = course
            
            day = entry['dayOfWeek']
            if day in weekly_schedule:
                weekly_schedule[day].append(entry)
        
        return serialize_mongo_doc(weekly_schedule)
