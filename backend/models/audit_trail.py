from datetime import datetime, timedelta
from bson import ObjectId
from utils.database import get_db
from utils.helpers import serialize_mongo_doc
import json

class AuditTrail:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.audit_trail
    
    def log_change(self, change_data):
        """Log a database change"""
        change_data.update({
            'timestamp': datetime.now(),
            'createdAt': datetime.now()
        })
        
        result = self.collection.insert_one(change_data)
        return str(result.inserted_id)
    
    def get_changes(self, limit=100, offset=0, collection_name=None, operation_type=None, 
                   start_date=None, end_date=None, entity_id=None):
        """Get audit trail with filtering"""
        filter_query = {}
        
        if collection_name:
            filter_query['collectionName'] = collection_name
        
        if operation_type:
            filter_query['operationType'] = operation_type
        
        if entity_id:
            filter_query['entityId'] = entity_id
        
        if start_date and end_date:
            filter_query['timestamp'] = {
                '$gte': start_date,
                '$lte': end_date
            }
        
        changes = list(self.collection.find(filter_query)
                      .sort('timestamp', -1)
                      .skip(offset)
                      .limit(limit))
        
        total = self.collection.count_documents(filter_query)
        
        return {
            'changes': serialize_mongo_doc(changes),
            'total': total,
            'hasMore': offset + limit < total
        }
    
    def get_entity_history(self, collection_name, entity_id):
        """Get complete change history for a specific entity"""
        changes = list(self.collection.find({
            'collectionName': collection_name,
            'entityId': str(entity_id)
        }).sort('timestamp', 1))
        
        return serialize_mongo_doc(changes)
    
    def rollback_operation(self, audit_id, rollback_reason=None):
        """Mark an operation for rollback"""
        audit_record = self.collection.find_one({'_id': ObjectId(audit_id)})
        
        if not audit_record or audit_record.get('operationType') == 'delete':
            return False
        
        # Create rollback entry
        rollback_data = {
            'originalAuditId': audit_id,
            'collectionName': audit_record['collectionName'],
            'entityId': audit_record['entityId'],
            'operationType': 'rollback',
            'beforeState': audit_record.get('afterState'),
            'afterState': audit_record.get('beforeState'),
            'rollbackReason': rollback_reason,
            'timestamp': datetime.now(),
            'createdAt': datetime.now(),
            'status': 'pending'
        }
        
        result = self.collection.insert_one(rollback_data)
        
        # Mark original as rolled back
        self.collection.update_one(
            {'_id': ObjectId(audit_id)},
            {'$set': {'rolledBack': True, 'rollbackId': str(result.inserted_id)}}
        )
        
        return str(result.inserted_id)
    
    def get_rollback_candidates(self, hours=24):
        """Get operations that can be rolled back"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        candidates = list(self.collection.find({
            'timestamp': {'$gte': cutoff_time},
            'operationType': {'$in': ['create', 'update']},
            'rolledBack': {'$ne': True}
        }).sort('timestamp', -1))
        
        return serialize_mongo_doc(candidates)
    
    def get_audit_stats(self):
        """Get audit trail statistics"""
        # Operation type stats
        type_pipeline = [
            {'$group': {
                '_id': '$operationType',
                'count': {'$sum': 1}
            }}
        ]
        type_stats = list(self.collection.aggregate(type_pipeline))
        
        # Collection stats
        collection_pipeline = [
            {'$group': {
                '_id': '$collectionName',
                'count': {'$sum': 1}
            }}
        ]
        collection_stats = list(self.collection.aggregate(collection_pipeline))
        
        # Daily activity
        daily_pipeline = [
            {'$group': {
                '_id': {
                    '$dateToString': {
                        'format': '%Y-%m-%d',
                        'date': '$timestamp'
                    }
                },
                'count': {'$sum': 1}
            }},
            {'$sort': {'_id': -1}},
            {'$limit': 7}
        ]
        daily_stats = list(self.collection.aggregate(daily_pipeline))
        
        return {
            'operationTypes': serialize_mongo_doc(type_stats),
            'collections': serialize_mongo_doc(collection_stats),
            'dailyActivity': serialize_mongo_doc(daily_stats),
            'totalChanges': self.collection.count_documents({})
        }
    
    def search_changes(self, search_term, limit=50):
        """Search audit trail"""
        filter_query = {
            '$or': [
                {'collectionName': {'$regex': search_term, '$options': 'i'}},
                {'entityId': {'$regex': search_term, '$options': 'i'}},
                {'mcpCommand': {'$regex': search_term, '$options': 'i'}},
                {'userId': {'$regex': search_term, '$options': 'i'}}
            ]
        }
        
        changes = list(self.collection.find(filter_query)
                      .sort('timestamp', -1)
                      .limit(limit))
        
        return serialize_mongo_doc(changes)
    
    def get_recent_changes(self, minutes=60, limit=100):
        """Get recent changes for real-time monitoring"""
        cutoff_time = datetime.now() - timedelta(minutes=minutes)
        
        changes = list(self.collection.find({
            'timestamp': {'$gte': cutoff_time}
        }).sort('timestamp', -1).limit(limit))
        
        return serialize_mongo_doc(changes)
    
    def validate_data_integrity(self, collection_name, entity_id):
        """Check data integrity for an entity"""
        changes = list(self.collection.find({
            'collectionName': collection_name,
            'entityId': str(entity_id)
        }).sort('timestamp', 1))
        
        if not changes:
            return {'valid': True, 'message': 'No changes found'}
        
        # Check for logical consistency
        issues = []
        
        for i in range(1, len(changes)):
            prev_change = changes[i-1]
            curr_change = changes[i]
            
            # Check if before state matches previous after state
            if (prev_change.get('afterState') != curr_change.get('beforeState')):
                issues.append({
                    'type': 'state_mismatch',
                    'changeId': str(curr_change['_id']),
                    'message': 'Before state does not match previous after state'
                })
        
        return {
            'valid': len(issues) == 0,
            'issues': issues,
            'totalChanges': len(changes)
        }
    
    def cleanup_old_audit_logs(self, days=90):
        """Clean up old audit logs"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        result = self.collection.delete_many({
            'timestamp': {'$lt': cutoff_date},
            'rolledBack': {'$ne': True}
        })
        
        return result.deleted_count
