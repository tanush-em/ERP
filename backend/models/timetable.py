from datetime import datetime
from bson import ObjectId
from utils.database import get_db
from utils.helpers import serialize_mongo_doc

class Timetable:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.timetable
    
    def create_entry(self, day, period, course_name, duration):
        """Create a new timetable entry"""
        timetable_data = {
            'day': day,
            'period': period,
            'course_name': course_name,
            'duration': duration,
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
        
        result = self.collection.insert_one(timetable_data)
        return str(result.inserted_id)
    
    def get_timetable(self, day=None):
        """Get timetable with optional filtering by day"""
        filter_query = {}
        
        if day:
            filter_query['day'] = day
        
        timetable = list(self.collection.find(filter_query).sort([('day', 1), ('period', 1)]))
        return serialize_mongo_doc(timetable)
    
    def get_timetable_by_day(self, day):
        """Get timetable entries for a specific day"""
        timetable = list(self.collection.find({'day': day}).sort('period', 1))
        return serialize_mongo_doc(timetable)
    
    def get_timetable_by_course(self, course_name):
        """Get timetable entries for a specific course"""
        timetable = list(self.collection.find({'course_name': course_name}).sort([('day', 1), ('period', 1)]))
        return serialize_mongo_doc(timetable)
    
    def update_timetable_entry(self, entry_id, day=None, period=None, course_name=None, duration=None):
        """Update a timetable entry"""
        update_data = {'updatedAt': datetime.now()}
        
        if day:
            update_data['day'] = day
        if period:
            update_data['period'] = period
        if course_name:
            update_data['course_name'] = course_name
        if duration:
            update_data['duration'] = duration
        
        result = self.collection.update_one(
            {'_id': ObjectId(entry_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    def delete_timetable_entry(self, entry_id):
        """Delete a timetable entry"""
        result = self.collection.delete_one({'_id': ObjectId(entry_id)})
        return result.deleted_count > 0
    
    def get_weekly_schedule(self):
        """Get organized weekly schedule"""
        timetable = list(self.collection.find().sort([('day', 1), ('period', 1)]))
        
        # Organize by day
        weekly_schedule = {
            'Monday': [],
            'Tuesday': [],
            'Wednesday': [],
            'Thursday': [],
            'Friday': [],
            'Saturday': [],
            'Sunday': []
        }
        
        for entry in timetable:
            day = entry['day']
            if day in weekly_schedule:
                weekly_schedule[day].append(entry)
        
        return serialize_mongo_doc(weekly_schedule)
    
    def get_timetable_stats(self):
        """Get timetable statistics"""
        total_entries = self.collection.count_documents({})
        
        # Day-wise count
        day_pipeline = [
            {'$group': {
                '_id': '$day',
                'count': {'$sum': 1}
            }},
            {'$sort': {'count': -1}}
        ]
        day_stats = list(self.collection.aggregate(day_pipeline))
        
        # Course-wise count
        course_pipeline = [
            {'$group': {
                '_id': '$course_name',
                'count': {'$sum': 1}
            }},
            {'$sort': {'count': -1}}
        ]
        course_stats = list(self.collection.aggregate(course_pipeline))
        
        return {
            'total_entries': total_entries,
            'day_wise': serialize_mongo_doc(day_stats),
            'course_wise': serialize_mongo_doc(course_stats)
        }
