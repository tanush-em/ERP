from datetime import datetime
from bson import ObjectId
from utils.database import get_db
from utils.helpers import serialize_mongo_doc, get_grade_from_marks, calculate_gpa

class Score:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.scores
    
    def add_score(self, student_id, course_id, exam_type, score, max_score):
        """Add a new score record"""
        score_data = {
            'studentId': ObjectId(student_id),
            'courseId': ObjectId(course_id),
            'examType': exam_type,
            'marks': score,
            'maxMarks': max_score,
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
        
        # Calculate grade if marks are provided
        if score is not None and max_score:
            score_data['grade'] = get_grade_from_marks(score, max_score)
        
        result = self.collection.insert_one(score_data)
        return str(result.inserted_id)
    
    def get_scores(self, course_id=None, student_id=None, exam_type=None):
        """Get scores with optional filtering"""
        filter_query = {}
        
        if course_id:
            filter_query['courseId'] = ObjectId(course_id)
        
        if student_id:
            filter_query['studentId'] = ObjectId(student_id)
            
        if exam_type:
            filter_query['examType'] = exam_type
        
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
            {'$sort': {'examDate': -1}}
        ]
        
        scores = list(self.collection.aggregate(pipeline))
        return serialize_mongo_doc(scores)
    
    def update_score(self, score_id, update_data):
        """Update a score record"""
        update_data['updatedAt'] = datetime.now()
        
        # Recalculate grade if marks are updated
        if 'marks' in update_data:
            existing_score = self.collection.find_one({'_id': ObjectId(score_id)})
            if existing_score:
                max_marks = update_data.get('maxMarks', existing_score.get('maxMarks', 100))
                update_data['grade'] = get_grade_from_marks(update_data['marks'], max_marks)
        
        result = self.collection.update_one(
            {'_id': ObjectId(score_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    def get_student_scores(self, student_id, course_id=None, exam_type=None):
        """Get scores for a student"""
        filter_query = {'studentId': ObjectId(student_id)}
        
        if course_id:
            filter_query['courseId'] = ObjectId(course_id)
        
        if exam_type:
            filter_query['examType'] = exam_type
        
        scores = list(self.collection.find(filter_query).sort('examDate', -1))
        
        # Populate course details
        for score in scores:
            course = self.db.courses.find_one({'_id': score['courseId']})
            score['course'] = course
        
        return serialize_mongo_doc(scores)
    
    def get_course_scores(self, course_id, exam_type=None):
        """Get all scores for a course"""
        filter_query = {'courseId': ObjectId(course_id)}
        
        if exam_type:
            filter_query['examType'] = exam_type
        
        scores = list(self.collection.find(filter_query).sort('examDate', -1))
        
        # Populate student details
        for score in scores:
            student = self.db.users.find_one({'_id': score['studentId']})
            score['student'] = student
        
        return serialize_mongo_doc(scores)
    
    def calculate_student_gpa(self, student_id, semester=None):
        """Calculate GPA for a student"""
        pipeline = [
            {'$match': {'studentId': ObjectId(student_id)}},
            {'$lookup': {
                'from': 'courses',
                'localField': 'courseId',
                'foreignField': '_id',
                'as': 'course'
            }},
            {'$unwind': '$course'},
        ]
        
        if semester:
            pipeline.append({'$match': {'semester': semester}})
        
        pipeline.extend([
            {'$group': {
                '_id': {
                    'courseId': '$courseId',
                    'semester': '$semester'
                },
                'finalGrade': {'$first': '$grade'},
                'credits': {'$first': '$course.credits'}
            }}
        ])
        
        results = list(self.collection.aggregate(pipeline))
        
        # Calculate GPA
        scores_for_gpa = []
        for result in results:
            scores_for_gpa.append({
                'grade': result['finalGrade'],
                'credits': result['credits']
            })
        
        gpa = calculate_gpa(scores_for_gpa)
        
        return {
            'gpa': gpa,
            'courses': len(scores_for_gpa),
            'totalCredits': sum(score['credits'] for score in scores_for_gpa),
            'semester': semester
        }
    
    def get_student_transcript(self, student_id):
        """Get complete academic transcript for a student"""
        pipeline = [
            {'$match': {'studentId': ObjectId(student_id)}},
            {'$lookup': {
                'from': 'courses',
                'localField': 'courseId',
                'foreignField': '_id',
                'as': 'course'
            }},
            {'$unwind': '$course'},
            {'$sort': {'semester': 1, 'course.courseCode': 1}}
        ]
        
        transcript = list(self.collection.aggregate(pipeline))
        
        # Calculate semester-wise GPA
        semester_gpas = {}
        for record in transcript:
            semester = record.get('semester')
            if semester not in semester_gpas:
                semester_gpas[semester] = []
            
            semester_gpas[semester].append({
                'grade': record.get('grade'),
                'credits': record['course'].get('credits', 0)
            })
        
        # Calculate GPAs
        for semester in semester_gpas:
            gpa_data = calculate_gpa(semester_gpas[semester])
            semester_gpas[semester] = {
                'gpa': gpa_data,
                'courses': len(semester_gpas[semester])
            }
        
        # Calculate overall GPA
        all_scores = []
        for record in transcript:
            all_scores.append({
                'grade': record.get('grade'),
                'credits': record['course'].get('credits', 0)
            })
        
        overall_gpa = calculate_gpa(all_scores)
        
        return {
            'transcript': serialize_mongo_doc(transcript),
            'semesterGPAs': semester_gpas,
            'overallGPA': overall_gpa,
            'totalCredits': sum(score['credits'] for score in all_scores)
        }
    
    def get_class_performance(self, course_id, exam_type):
        """Get class performance statistics for a course"""
        pipeline = [
            {'$match': {
                'courseId': ObjectId(course_id),
                'examType': exam_type
            }},
            {'$group': {
                '_id': None,
                'averageMarks': {'$avg': '$marks'},
                'maxMarks': {'$max': '$marks'},
                'minMarks': {'$min': '$marks'},
                'totalStudents': {'$sum': 1},
                'gradeDistribution': {
                    '$push': '$grade'
                }
            }}
        ]
        
        result = list(self.collection.aggregate(pipeline))
        
        if result:
            stats = result[0]
            
            # Calculate grade distribution
            grade_counts = {}
            for grade in stats['gradeDistribution']:
                grade_counts[grade] = grade_counts.get(grade, 0) + 1
            
            stats['gradeDistribution'] = grade_counts
            return serialize_mongo_doc(stats)
        
        return None
    
    def get_topper_list(self, course_id=None, exam_type=None, limit=10):
        """Get top performers"""
        match_filter = {}
        
        if course_id:
            match_filter['courseId'] = ObjectId(course_id)
        
        if exam_type:
            match_filter['examType'] = exam_type
        
        pipeline = [
            {'$match': match_filter},
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
            {'$sort': {'marks': -1}},
            {'$limit': limit}
        ]
        
        toppers = list(self.collection.aggregate(pipeline))
        return serialize_mongo_doc(toppers)
    
    def bulk_add_scores(self, scores_data):
        """Bulk add scores for multiple students"""
        for score in scores_data:
            score['createdAt'] = datetime.now()
            score['updatedAt'] = datetime.now()
            
            # Calculate grade if marks are provided
            if 'marks' in score and 'maxMarks' in score:
                score['grade'] = get_grade_from_marks(score['marks'], score['maxMarks'])
        
        result = self.collection.insert_many(scores_data)
        return len(result.inserted_ids)
