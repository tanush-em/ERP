from datetime import datetime, timedelta
from bson import ObjectId
from utils.database import get_db
from utils.helpers import serialize_mongo_doc

class Fee:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.fees
    
    def create_fee(self, fee_data):
        """Create a new fee record"""
        fee_data['createdAt'] = datetime.now()
        fee_data['updatedAt'] = datetime.now()
        fee_data['isPaid'] = False
        
        result = self.collection.insert_one(fee_data)
        return str(result.inserted_id)
    
    def get_all_fees(self, student_id=None, academic_year=None, status=None):
        """Get all fee records with optional filtering"""
        filter_query = {}
        
        if student_id:
            filter_query['studentId'] = ObjectId(student_id)
        
        if academic_year:
            filter_query['academicYear'] = academic_year
            
        if status == 'paid':
            filter_query['isPaid'] = True
        elif status == 'pending':
            filter_query['isPaid'] = False
        elif status == 'overdue':
            filter_query['isPaid'] = False
            filter_query['dueDate'] = {'$lt': datetime.now()}
        
        pipeline = [
            {'$match': filter_query},
            {'$lookup': {
                'from': 'students',
                'localField': 'studentId',
                'foreignField': '_id',
                'as': 'student'
            }},
            {'$unwind': '$student'},
            {'$sort': {'dueDate': 1}}
        ]
        
        fees = list(self.collection.aggregate(pipeline))
        return serialize_mongo_doc(fees)
    
    def record_payment(self, fee_id, payment_method='cash', transaction_id='', paid_amount=None):
        """Record fee payment"""
        fee = self.collection.find_one({'_id': ObjectId(fee_id)})
        if not fee:
            return False
            
        update_data = {
            'isPaid': True,
            'paymentDate': datetime.now(),
            'paymentMethod': payment_method,
            'transactionId': transaction_id,
            'updatedAt': datetime.now()
        }
        
        if paid_amount:
            update_data['paidAmount'] = paid_amount
        
        result = self.collection.update_one(
            {'_id': ObjectId(fee_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    def get_student_fees(self, student_id, academic_year=None):
        """Get fee records for a student"""
        filter_query = {'studentId': ObjectId(student_id)}
        
        if academic_year:
            filter_query['academicYear'] = academic_year
        
        fees = list(self.collection.find(filter_query).sort('dueDate', 1))
        return serialize_mongo_doc(fees)
    
    def get_fee_by_id(self, fee_id):
        """Get fee record by ID"""
        fee = self.collection.find_one({'_id': ObjectId(fee_id)})
        return serialize_mongo_doc(fee)
    
    def update_payment_status(self, fee_id, payment_data):
        """Update payment status and details"""
        update_data = {
            'isPaid': True,
            'paymentDate': payment_data.get('paymentDate', datetime.now()),
            'paymentMethod': payment_data.get('paymentMethod'),
            'transactionId': payment_data.get('transactionId'),
            'paymentReference': payment_data.get('paymentReference'),
            'updatedAt': datetime.now()
        }
        
        result = self.collection.update_one(
            {'_id': ObjectId(fee_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    def get_pending_fees(self, student_id=None):
        """Get all pending fees"""
        filter_query = {'isPaid': False}
        
        if student_id:
            filter_query['studentId'] = ObjectId(student_id)
        
        fees = list(self.collection.find(filter_query).sort('dueDate', 1))
        
        # Populate student details if not filtering by student
        if not student_id:
            for fee in fees:
                student = self.db.users.find_one({'_id': fee['studentId']})
                fee['student'] = student
        
        return serialize_mongo_doc(fees)
    
    def get_overdue_fees(self, student_id=None):
        """Get overdue fees"""
        filter_query = {
            'isPaid': False,
            'dueDate': {'$lt': datetime.now()}
        }
        
        if student_id:
            filter_query['studentId'] = ObjectId(student_id)
        
        fees = list(self.collection.find(filter_query).sort('dueDate', 1))
        
        # Populate student details if not filtering by student
        if not student_id:
            for fee in fees:
                student = self.db.users.find_one({'_id': fee['studentId']})
                fee['student'] = student
        
        return serialize_mongo_doc(fees)
    
    def calculate_total_fees(self, student_id, academic_year=None):
        """Calculate total fees for a student"""
        filter_query = {'studentId': ObjectId(student_id)}
        
        if academic_year:
            filter_query['academicYear'] = academic_year
        
        pipeline = [
            {'$match': filter_query},
            {'$group': {
                '_id': None,
                'totalAmount': {'$sum': '$amount'},
                'paidAmount': {
                    '$sum': {
                        '$cond': [{'$eq': ['$isPaid', True]}, '$amount', 0]
                    }
                },
                'pendingAmount': {
                    '$sum': {
                        '$cond': [{'$eq': ['$isPaid', False]}, '$amount', 0]
                    }
                }
            }}
        ]
        
        result = list(self.collection.aggregate(pipeline))
        
        if result:
            return serialize_mongo_doc(result[0])
        
        return {
            'totalAmount': 0,
            'paidAmount': 0,
            'pendingAmount': 0
        }
    
    def get_fee_statistics(self):
        """Get fee collection statistics"""
        # Total fees
        total_pipeline = [
            {'$group': {
                '_id': None,
                'totalAmount': {'$sum': '$amount'},
                'totalRecords': {'$sum': 1}
            }}
        ]
        total_stats = list(self.collection.aggregate(total_pipeline))
        
        # Payment status stats
        status_pipeline = [
            {'$group': {
                '_id': '$isPaid',
                'count': {'$sum': 1},
                'amount': {'$sum': '$amount'}
            }}
        ]
        status_stats = list(self.collection.aggregate(status_pipeline))
        
        # Fee type stats
        type_pipeline = [
            {'$group': {
                '_id': '$feeType',
                'count': {'$sum': 1},
                'amount': {'$sum': '$amount'}
            }}
        ]
        type_stats = list(self.collection.aggregate(type_pipeline))
        
        return {
            'total': serialize_mongo_doc(total_stats[0] if total_stats else {}),
            'statusWise': serialize_mongo_doc(status_stats),
            'typeWise': serialize_mongo_doc(type_stats)
        }
    
    def bulk_create_fees(self, student_ids, fee_data):
        """Create fee records for multiple students"""
        fees = []
        for student_id in student_ids:
            fee = fee_data.copy()
            fee['studentId'] = ObjectId(student_id)
            fee['createdAt'] = datetime.now()
            fee['updatedAt'] = datetime.now()
            fee['isPaid'] = False
            fees.append(fee)
        
        if fees:
            result = self.collection.insert_many(fees)
            return len(result.inserted_ids)
        return 0
    
    def generate_fee_receipt(self, fee_id):
        """Generate fee receipt data"""
        fee = self.collection.find_one({'_id': ObjectId(fee_id)})
        
        if not fee or not fee.get('isPaid'):
            return None
        
        # Get student details
        student = self.db.users.find_one({'_id': fee['studentId']})
        
        receipt_data = {
            'receiptNumber': f"RCP-{fee_id}",
            'fee': serialize_mongo_doc(fee),
            'student': serialize_mongo_doc(student),
            'generatedAt': datetime.now()
        }
        
        return receipt_data
    
    def get_defaulters_list(self, days_overdue=30):
        """Get list of students with overdue fees"""
        cutoff_date = datetime.now() - timedelta(days=days_overdue)
        
        pipeline = [
            {'$match': {
                'isPaid': False,
                'dueDate': {'$lt': cutoff_date}
            }},
            {'$lookup': {
                'from': 'users',
                'localField': 'studentId',
                'foreignField': '_id',
                'as': 'student'
            }},
            {'$unwind': '$student'},
            {'$group': {
                '_id': '$studentId',
                'student': {'$first': '$student'},
                'totalOverdue': {'$sum': '$amount'},
                'overdueCount': {'$sum': 1},
                'oldestDue': {'$min': '$dueDate'}
            }},
            {'$sort': {'oldestDue': 1}}
        ]
        
        defaulters = list(self.collection.aggregate(pipeline))
        return serialize_mongo_doc(defaulters)
