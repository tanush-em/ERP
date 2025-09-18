from datetime import datetime
from bson import ObjectId
from utils.database import get_db
from utils.helpers import serialize_mongo_doc

class Enrollment:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.enrollments
    
    def enroll_student(self, enrollment_data):
        """Enroll a student in a course"""
        enrollment_data['enrollmentDate'] = datetime.now()
        enrollment_data['createdAt'] = datetime.now()
        enrollment_data['updatedAt'] = datetime.now()
        
        result = self.collection.insert_one(enrollment_data)
        return str(result.inserted_id)
    
    def get_student_enrollments(self, student_id, status=None):
        """Get all enrollments for a student"""
        filter_query = {'studentId': ObjectId(student_id)}
        if status:
            filter_query['status'] = status
        
        enrollments = list(self.collection.find(filter_query))
        
        # Populate course details
        for enrollment in enrollments:
            course = self.db.courses.find_one({'_id': enrollment['courseId']})
            enrollment['course'] = course
        
        return serialize_mongo_doc(enrollments)
    
    def get_course_enrollments(self, course_id, status=None):
        """Get all enrollments for a course"""
        filter_query = {'courseId': ObjectId(course_id)}
        if status:
            filter_query['status'] = status
        
        enrollments = list(self.collection.find(filter_query))
        
        # Populate student details
        for enrollment in enrollments:
            student = self.db.users.find_one({'_id': enrollment['studentId']})
            enrollment['student'] = student
        
        return serialize_mongo_doc(enrollments)
    
    def check_enrollment(self, student_id, course_id):
        """Check if student is enrolled in a course"""
        enrollment = self.collection.find_one({
            'studentId': ObjectId(student_id),
            'courseId': ObjectId(course_id)
        })
        return serialize_mongo_doc(enrollment)
    
    def update_enrollment_status(self, enrollment_id, status):
        """Update enrollment status"""
        result = self.collection.update_one(
            {'_id': ObjectId(enrollment_id)},
            {'$set': {'status': status, 'updatedAt': datetime.now()}}
        )
        return result.modified_count > 0
    
    def get_enrollment_stats(self):
        """Get enrollment statistics"""
        # Total enrollments
        total_enrollments = self.collection.count_documents({})
        
        # Status-wise count
        status_pipeline = [
            {'$group': {
                '_id': '$status',
                'count': {'$sum': 1}
            }}
        ]
        status_stats = list(self.collection.aggregate(status_pipeline))
        
        # Semester-wise enrollment count
        semester_pipeline = [
            {'$group': {
                '_id': '$semester',
                'count': {'$sum': 1}
            }},
            {'$sort': {'_id': 1}}
        ]
        semester_stats = list(self.collection.aggregate(semester_pipeline))
        
        return {
            'totalEnrollments': total_enrollments,
            'statusWise': serialize_mongo_doc(status_stats),
            'semesterWise': serialize_mongo_doc(semester_stats)
        }
    
    def bulk_enroll_students(self, student_ids, course_id, semester, academic_year):
        """Bulk enroll multiple students in a course"""
        enrollments = []
        for student_id in student_ids:
            enrollments.append({
                'studentId': ObjectId(student_id),
                'courseId': ObjectId(course_id),
                'enrollmentDate': datetime.now(),
                'status': 'enrolled',
                'semester': semester,
                'academicYear': academic_year,
                'createdAt': datetime.now(),
                'updatedAt': datetime.now()
            })
        
        result = self.collection.insert_many(enrollments)
        return len(result.inserted_ids)
    
    def get_student_current_courses(self, student_id, semester):
        """Get current semester courses for a student"""
        pipeline = [
            {'$match': {
                'studentId': ObjectId(student_id),
                'semester': semester,
                'status': 'enrolled'
            }},
            {'$lookup': {
                'from': 'courses',
                'localField': 'courseId',
                'foreignField': '_id',
                'as': 'course'
            }},
            {'$unwind': '$course'},
            {'$sort': {'course.courseCode': 1}}
        ]
        
        courses = list(self.collection.aggregate(pipeline))
        return serialize_mongo_doc(courses)
