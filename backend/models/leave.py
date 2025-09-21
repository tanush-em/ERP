from datetime import datetime
from bson import ObjectId
from utils.database import get_db
from utils.helpers import serialize_mongo_doc

class Leave:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.leave
    
    def create_leave_request(self, roll_no, name, date_of_leave, reason, status='pending'):
        """Create a new leave request"""
        leave_data = {
            'roll_no': roll_no,
            'name': name,
            'date_of_leave': date_of_leave,
            'reason': reason,
            'status': status,  # pending, approved, rejected
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
        
        result = self.collection.insert_one(leave_data)
        return str(result.inserted_id)
    
    def get_all_leave_requests(self):
        """Get all leave requests"""
        records = list(self.collection.find().sort('date_of_leave', -1))
        return serialize_mongo_doc(records)
    
    def get_leave_by_roll_no(self, roll_no):
        """Get leave requests by roll number"""
        records = list(self.collection.find({'roll_no': roll_no}).sort('date_of_leave', -1))
        return serialize_mongo_doc(records)
    
    def get_leave_by_status(self, status):
        """Get leave requests by status"""
        records = list(self.collection.find({'status': status}).sort('date_of_leave', -1))
        return serialize_mongo_doc(records)
    
    def update_leave_status(self, leave_id, status):
        """Update leave request status"""
        result = self.collection.update_one(
            {'_id': ObjectId(leave_id)},
            {
                '$set': {
                    'status': status,
                    'updatedAt': datetime.now()
                }
            }
        )
        return result.modified_count > 0
    
    def delete_leave_request(self, leave_id):
        """Delete a leave request"""
        result = self.collection.delete_one({'_id': ObjectId(leave_id)})
        return result.deleted_count > 0
    
    def get_leave_stats(self):
        """Get leave statistics"""
        total_requests = self.collection.count_documents({})
        pending_requests = self.collection.count_documents({'status': 'pending'})
        approved_requests = self.collection.count_documents({'status': 'approved'})
        rejected_requests = self.collection.count_documents({'status': 'rejected'})
        
        return {
            'total_requests': total_requests,
            'pending_requests': pending_requests,
            'approved_requests': approved_requests,
            'rejected_requests': rejected_requests
        }
    
    def search_leave_requests(self, query):
        """Search leave requests by name or roll number"""
        search_filter = {
            '$or': [
                {'name': {'$regex': query, '$options': 'i'}},
                {'roll_no': {'$regex': query, '$options': 'i'}},
                {'reason': {'$regex': query, '$options': 'i'}}
            ]
        }
        
        records = list(self.collection.find(search_filter).sort('date_of_leave', -1))
        return serialize_mongo_doc(records)
