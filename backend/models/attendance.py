from datetime import datetime, timedelta
from bson import ObjectId
from pymongo import UpdateOne
from utils.database import get_db
from utils.helpers import serialize_mongo_doc, calculate_attendance_percentage

class Attendance:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.attendance
    
    def mark_attendance(self, student_id, course_id, date, status):
        """Mark attendance for a student"""
        attendance_data = {
            'studentId': ObjectId(student_id),
            'courseId': ObjectId(course_id),
            'date': date,
            'status': status,
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
        
        # Use upsert to handle duplicate entries
        result = self.collection.update_one(
            {
                'studentId': ObjectId(student_id),
                'courseId': ObjectId(course_id),
                'date': date
            },
            {'$set': attendance_data},
            upsert=True
        )
        
        return str(result.upserted_id) if result.upserted_id else True
    
    def get_attendance_records(self, course_id=None, student_id=None, date=None):
        """Get attendance records with optional filtering"""
        filter_query = {}
        
        if course_id:
            filter_query['courseId'] = ObjectId(course_id)
        
        if student_id:
            filter_query['studentId'] = ObjectId(student_id)
            
        if date:
            filter_query['date'] = date
        
        pipeline = [
            {'$match': filter_query},
            {'$lookup': {
                'from': 'students',
                'localField': 'studentId',
                'foreignField': '_id',
                'as': 'student'
            }},
            {'$lookup': {
                'from': 'courses',
                'localField': 'courseId',
                'foreignField': '_id',
                'as': 'course'
            }},
            {'$unwind': '$student'},
            {'$unwind': '$course'},
            {'$sort': {'date': -1}}
        ]
        
        records = list(self.collection.aggregate(pipeline))
        return serialize_mongo_doc(records)
    
    def bulk_mark_attendance(self, attendance_records):
        """Bulk mark attendance for multiple students"""
        operations = []
        for record in attendance_records:
            record['createdAt'] = datetime.now()
            record['updatedAt'] = datetime.now()
            
            operations.append(UpdateOne(
                {
                    'studentId': record['studentId'],
                    'courseId': record['courseId'],
                    'date': record['date']
                },
                {'$set': record},
                upsert=True
            ))
        
        if operations:
            result = self.collection.bulk_write(operations)
            return result.upserted_count + result.modified_count
        return 0
    
    def get_student_attendance(self, student_id, course_id=None, start_date=None, end_date=None):
        """Get attendance records for a student"""
        filter_query = {'studentId': ObjectId(student_id)}
        
        if course_id:
            filter_query['courseId'] = ObjectId(course_id)
        
        if start_date and end_date:
            filter_query['date'] = {
                '$gte': start_date,
                '$lte': end_date
            }
        
        attendance_records = list(self.collection.find(filter_query).sort('date', -1))
        
        # Populate course details
        for record in attendance_records:
            course = self.db.courses.find_one({'_id': record['courseId']})
            record['course'] = course
        
        return serialize_mongo_doc(attendance_records)
    
    def get_course_attendance(self, course_id, date=None):
        """Get attendance records for a course"""
        filter_query = {'courseId': ObjectId(course_id)}
        
        if date:
            filter_query['date'] = date
        
        attendance_records = list(self.collection.find(filter_query).sort('date', -1))
        
        # Populate student details
        for record in attendance_records:
            student = self.db.users.find_one({'_id': record['studentId']})
            record['student'] = student
        
        return serialize_mongo_doc(attendance_records)
    
    def calculate_student_attendance_percentage(self, student_id, course_id, start_date=None, end_date=None):
        """Calculate attendance percentage for a student in a course"""
        filter_query = {
            'studentId': ObjectId(student_id),
            'courseId': ObjectId(course_id)
        }
        
        if start_date and end_date:
            filter_query['date'] = {
                '$gte': start_date,
                '$lte': end_date
            }
        
        total_classes = self.collection.count_documents(filter_query)
        present_classes = self.collection.count_documents({
            **filter_query,
            'status': {'$in': ['present', 'late']}
        })
        
        percentage = calculate_attendance_percentage(present_classes, total_classes)
        
        return {
            'totalClasses': total_classes,
            'presentClasses': present_classes,
            'absentClasses': total_classes - present_classes,
            'percentage': percentage
        }
    
    def get_student_overall_attendance(self, student_id):
        """Get overall attendance summary for a student"""
        pipeline = [
            {'$match': {'studentId': ObjectId(student_id)}},
            {'$lookup': {
                'from': 'courses',
                'localField': 'courseId',
                'foreignField': '_id',
                'as': 'course'
            }},
            {'$unwind': '$course'},
            {'$group': {
                '_id': {
                    'courseId': '$courseId',
                    'courseName': '$course.courseName',
                    'courseCode': '$course.courseCode'
                },
                'totalClasses': {'$sum': 1},
                'presentClasses': {
                    '$sum': {
                        '$cond': [
                            {'$in': ['$status', ['present', 'late']]},
                            1, 0
                        ]
                    }
                }
            }},
            {'$addFields': {
                'percentage': {
                    '$multiply': [
                        {'$divide': ['$presentClasses', '$totalClasses']},
                        100
                    ]
                }
            }},
            {'$sort': {'_id.courseCode': 1}}
        ]
        
        attendance_summary = list(self.collection.aggregate(pipeline))
        return serialize_mongo_doc(attendance_summary)
    
    def get_attendance_report(self, course_id, start_date, end_date):
        """Get attendance report for a course within date range"""
        pipeline = [
            {'$match': {
                'courseId': ObjectId(course_id),
                'date': {'$gte': start_date, '$lte': end_date}
            }},
            {'$lookup': {
                'from': 'users',
                'localField': 'studentId',
                'foreignField': '_id',
                'as': 'student'
            }},
            {'$unwind': '$student'},
            {'$group': {
                '_id': {
                    'studentId': '$studentId',
                    'rollNumber': '$student.profile.rollNumber',
                    'name': {
                        '$concat': ['$student.profile.firstName', ' ', '$student.profile.lastName']
                    }
                },
                'totalClasses': {'$sum': 1},
                'presentClasses': {
                    '$sum': {
                        '$cond': [
                            {'$in': ['$status', ['present', 'late']]},
                            1, 0
                        ]
                    }
                }
            }},
            {'$addFields': {
                'percentage': {
                    '$multiply': [
                        {'$divide': ['$presentClasses', '$totalClasses']},
                        100
                    ]
                }
            }},
            {'$sort': {'_id.rollNumber': 1}}
        ]
        
        report = list(self.collection.aggregate(pipeline))
        return serialize_mongo_doc(report)
    
    def get_low_attendance_students(self, threshold=75):
        """Get students with attendance below threshold"""
        pipeline = [
            {'$lookup': {
                'from': 'users',
                'localField': 'studentId',
                'foreignField': '_id',
                'as': 'student'
            }},
            {'$unwind': '$student'},
            {'$lookup': {
                'from': 'courses',
                'localField': 'courseId',
                'foreignField': '_id',
                'as': 'course'
            }},
            {'$unwind': '$course'},
            {'$group': {
                '_id': {
                    'studentId': '$studentId',
                    'courseId': '$courseId',
                    'rollNumber': '$student.profile.rollNumber',
                    'name': {
                        '$concat': ['$student.profile.firstName', ' ', '$student.profile.lastName']
                    },
                    'courseName': '$course.courseName',
                    'courseCode': '$course.courseCode'
                },
                'totalClasses': {'$sum': 1},
                'presentClasses': {
                    '$sum': {
                        '$cond': [
                            {'$in': ['$status', ['present', 'late']]},
                            1, 0
                        ]
                    }
                }
            }},
            {'$addFields': {
                'percentage': {
                    '$multiply': [
                        {'$divide': ['$presentClasses', '$totalClasses']},
                        100
                    ]
                }
            }},
            {'$match': {'percentage': {'$lt': threshold}}},
            {'$sort': {'percentage': 1}}
        ]
        
        low_attendance = list(self.collection.aggregate(pipeline))
        return serialize_mongo_doc(low_attendance)
