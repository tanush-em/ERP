from datetime import datetime, timedelta
from bson import ObjectId
from utils.database import get_db
from utils.helpers import serialize_mongo_doc

class MCPOperation:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.mcp_operations
    
    def log_operation(self, operation_data):
        """Log an MCP operation"""
        operation_data.update({
            'timestamp': datetime.now(),
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        })
        
        result = self.collection.insert_one(operation_data)
        return str(result.inserted_id)
    
    def get_operations(self, limit=100, offset=0, status=None, operation_type=None, start_date=None, end_date=None):
        """Get MCP operations with filtering"""
        filter_query = {}
        
        if status:
            filter_query['status'] = status
        
        if operation_type:
            filter_query['operationType'] = operation_type
        
        if start_date and end_date:
            filter_query['timestamp'] = {
                '$gte': start_date,
                '$lte': end_date
            }
        
        operations = list(self.collection.find(filter_query)
                         .sort('timestamp', -1)
                         .skip(offset)
                         .limit(limit))
        
        total = self.collection.count_documents(filter_query)
        
        return {
            'operations': serialize_mongo_doc(operations),
            'total': total,
            'hasMore': offset + limit < total
        }
    
    def update_operation_status(self, operation_id, status, result_data=None, error_message=None):
        """Update operation status"""
        update_data = {
            'status': status,
            'updatedAt': datetime.now()
        }
        
        if status == 'completed' and result_data:
            update_data['result'] = result_data
            update_data['completedAt'] = datetime.now()
        elif status == 'failed' and error_message:
            update_data['errorMessage'] = error_message
            update_data['failedAt'] = datetime.now()
        
        result = self.collection.update_one(
            {'_id': ObjectId(operation_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    def get_operation_stats(self):
        """Get operation statistics"""
        pipeline = [
            {'$group': {
                '_id': '$status',
                'count': {'$sum': 1},
                'avgExecutionTime': {'$avg': '$executionTime'}
            }}
        ]
        
        status_stats = list(self.collection.aggregate(pipeline))
        
        # Operation type statistics
        type_pipeline = [
            {'$group': {
                '_id': '$operationType',
                'count': {'$sum': 1},
                'successRate': {
                    '$avg': {
                        '$cond': [{'$eq': ['$status', 'completed']}, 1, 0]
                    }
                }
            }}
        ]
        
        type_stats = list(self.collection.aggregate(type_pipeline))
        
        # Recent operations count
        recent_count = self.collection.count_documents({
            'timestamp': {'$gte': datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)}
        })
        
        return {
            'statusStats': serialize_mongo_doc(status_stats),
            'typeStats': serialize_mongo_doc(type_stats),
            'todayCount': recent_count,
            'totalOperations': self.collection.count_documents({})
        }
    
    def get_live_operations(self, limit=20):
        """Get most recent operations for live feed"""
        operations = list(self.collection.find()
                         .sort('timestamp', -1)
                         .limit(limit))
        
        return serialize_mongo_doc(operations)
    
    def get_failed_operations(self, limit=50):
        """Get failed operations for troubleshooting"""
        operations = list(self.collection.find({'status': 'failed'})
                         .sort('timestamp', -1)
                         .limit(limit))
        
        return serialize_mongo_doc(operations)
    
    def get_operation_by_id(self, operation_id):
        """Get specific operation details"""
        operation = self.collection.find_one({'_id': ObjectId(operation_id)})
        return serialize_mongo_doc(operation)
    
    def delete_old_operations(self, days=30):
        """Clean up old operation logs"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        result = self.collection.delete_many({
            'timestamp': {'$lt': cutoff_date},
            'status': {'$in': ['completed', 'failed']}
        })
        
        return result.deleted_count
