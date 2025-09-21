import json
import hashlib
from datetime import datetime, timedelta
from models.audit_trail import AuditTrail
from models.mcp_operation import MCPOperation
from utils.database import get_db
from bson import ObjectId
import logging

class AuditService:
    def __init__(self):
        self.audit_trail = AuditTrail()
        self.mcp_operation = MCPOperation()
        self.db = get_db()
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def log_database_change(self, collection_name, operation_type, entity_id, 
                          before_state=None, after_state=None, mcp_command=None, 
                          user_id=None, metadata=None):
        """Log a database change with full context"""
        try:
            change_data = {
                'collectionName': collection_name,
                'operationType': operation_type,  # create, update, delete
                'entityId': str(entity_id),
                'beforeState': before_state,
                'afterState': after_state,
                'mcpCommand': mcp_command,
                'userId': user_id,
                'metadata': metadata or {},
                'changeHash': self._generate_change_hash(collection_name, entity_id, operation_type, after_state),
                'ipAddress': metadata.get('ipAddress') if metadata else None,
                'userAgent': metadata.get('userAgent') if metadata else None
            }
            
            audit_id = self.audit_trail.log_change(change_data)
            self.logger.info(f"Logged change: {collection_name}.{operation_type} for entity {entity_id}")
            
            return audit_id
            
        except Exception as e:
            self.logger.error(f"Error logging database change: {str(e)}")
            return None
    
    def _generate_change_hash(self, collection_name, entity_id, operation_type, after_state):
        """Generate a hash for the change to detect tampering"""
        try:
            content = f"{collection_name}:{entity_id}:{operation_type}:{json.dumps(after_state, sort_keys=True, default=str)}"
            return hashlib.sha256(content.encode()).hexdigest()
        except Exception:
            return None
    
    def validate_change_integrity(self, audit_id):
        """Validate that a change hasn't been tampered with"""
        try:
            change = self.audit_trail.collection.find_one({'_id': ObjectId(audit_id)})
            if not change:
                return {'valid': False, 'error': 'Change record not found'}
            
            # Recalculate hash
            expected_hash = self._generate_change_hash(
                change['collectionName'],
                change['entityId'],
                change['operationType'],
                change['afterState']
            )
            
            stored_hash = change.get('changeHash')
            
            return {
                'valid': expected_hash == stored_hash,
                'expectedHash': expected_hash,
                'storedHash': stored_hash
            }
            
        except Exception as e:
            return {'valid': False, 'error': str(e)}
    
    def perform_rollback(self, audit_id, rollback_reason=None):
        """Perform actual rollback of a database change"""
        try:
            # Get the audit record
            audit_record = self.audit_trail.collection.find_one({'_id': ObjectId(audit_id)})
            if not audit_record:
                return {'success': False, 'error': 'Audit record not found'}
            
            if audit_record.get('rolledBack'):
                return {'success': False, 'error': 'Change already rolled back'}
            
            collection_name = audit_record['collectionName']
            entity_id = audit_record['entityId']
            operation_type = audit_record['operationType']
            before_state = audit_record.get('beforeState')
            
            # Get the target collection
            target_collection = self.db[collection_name]
            
            rollback_successful = False
            
            if operation_type == 'create':
                # Delete the created record
                result = target_collection.delete_one({'_id': ObjectId(entity_id)})
                rollback_successful = result.deleted_count > 0
                
            elif operation_type == 'update' and before_state:
                # Restore the previous state
                result = target_collection.replace_one(
                    {'_id': ObjectId(entity_id)},
                    before_state
                )
                rollback_successful = result.modified_count > 0
                
            elif operation_type == 'delete' and before_state:
                # Recreate the deleted record
                before_state['_id'] = ObjectId(entity_id)
                result = target_collection.insert_one(before_state)
                rollback_successful = result.inserted_id is not None
            
            if rollback_successful:
                # Mark as rolled back in audit trail
                rollback_id = self.audit_trail.rollback_operation(audit_id, rollback_reason)
                
                # Log the rollback as a new change
                self.log_database_change(
                    collection_name=collection_name,
                    operation_type='rollback',
                    entity_id=entity_id,
                    before_state=audit_record.get('afterState'),
                    after_state=before_state,
                    mcp_command=f"ROLLBACK:{audit_id}",
                    metadata={'rollbackReason': rollback_reason, 'originalAuditId': audit_id}
                )
                
                return {
                    'success': True,
                    'rollbackId': rollback_id,
                    'message': f'Successfully rolled back {operation_type} operation'
                }
            else:
                return {
                    'success': False,
                    'error': f'Failed to rollback {operation_type} operation'
                }
                
        except Exception as e:
            self.logger.error(f"Error performing rollback: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_entity_audit_trail(self, collection_name, entity_id):
        """Get complete audit trail for a specific entity"""
        try:
            changes = self.audit_trail.get_entity_history(collection_name, entity_id)
            
            # Add validation status for each change
            for change in changes:
                if change.get('changeHash'):
                    validation = self.validate_change_integrity(str(change['_id']))
                    change['validationStatus'] = validation
            
            return {
                'success': True,
                'changes': changes,
                'totalChanges': len(changes)
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def detect_suspicious_activity(self, hours=24):
        """Detect potentially suspicious database activity"""
        try:
            cutoff_time = datetime.now() - timedelta(hours=hours)
            
            suspicious_patterns = []
            
            # Pattern 1: Rapid successive changes to same entity
            rapid_changes_pipeline = [
                {'$match': {'timestamp': {'$gte': cutoff_time}}},
                {'$group': {
                    '_id': {
                        'collection': '$collectionName',
                        'entity': '$entityId'
                    },
                    'changeCount': {'$sum': 1},
                    'changes': {'$push': {
                        'timestamp': '$timestamp',
                        'operation': '$operationType',
                        'userId': '$userId'
                    }}
                }},
                {'$match': {'changeCount': {'$gte': 5}}}  # 5+ changes to same entity
            ]
            
            rapid_changes = list(self.audit_trail.collection.aggregate(rapid_changes_pipeline))
            
            for item in rapid_changes:
                suspicious_patterns.append({
                    'type': 'rapid_changes',
                    'severity': 'medium',
                    'description': f"Rapid changes detected for {item['_id']['collection']} entity {item['_id']['entity']}",
                    'details': {
                        'changeCount': item['changeCount'],
                        'collection': item['_id']['collection'],
                        'entityId': item['_id']['entity']
                    }
                })
            
            # Pattern 2: Failed validation checks
            invalid_changes = list(self.audit_trail.collection.find({
                'timestamp': {'$gte': cutoff_time},
                'changeHash': {'$exists': True}
            }))
            
            for change in invalid_changes:
                validation = self.validate_change_integrity(str(change['_id']))
                if not validation.get('valid'):
                    suspicious_patterns.append({
                        'type': 'invalid_hash',
                        'severity': 'high',
                        'description': f"Change integrity validation failed for {change['collectionName']} entity {change['entityId']}",
                        'details': {
                            'auditId': str(change['_id']),
                            'collection': change['collectionName'],
                            'entityId': change['entityId'],
                            'validation': validation
                        }
                    })
            
            # Pattern 3: Unusual operation patterns
            unusual_ops_pipeline = [
                {'$match': {'timestamp': {'$gte': cutoff_time}}},
                {'$group': {
                    '_id': {
                        'userId': '$userId',
                        'operation': '$operationType'
                    },
                    'count': {'$sum': 1}
                }},
                {'$match': {'count': {'$gte': 50}}}  # 50+ operations of same type by same user
            ]
            
            unusual_ops = list(self.audit_trail.collection.aggregate(unusual_ops_pipeline))
            
            for item in unusual_ops:
                if item['_id']['userId']:  # Skip system operations
                    suspicious_patterns.append({
                        'type': 'unusual_volume',
                        'severity': 'low',
                        'description': f"Unusual volume of {item['_id']['operation']} operations by user {item['_id']['userId']}",
                        'details': {
                            'userId': item['_id']['userId'],
                            'operation': item['_id']['operation'],
                            'count': item['count']
                        }
                    })
            
            return {
                'success': True,
                'suspiciousPatterns': suspicious_patterns,
                'totalPatterns': len(suspicious_patterns),
                'timeRange': f"Last {hours} hours"
            }
            
        except Exception as e:
            self.logger.error(f"Error detecting suspicious activity: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def generate_compliance_report(self, start_date, end_date, collection_name=None):
        """Generate compliance audit report"""
        try:
            filter_query = {
                'timestamp': {
                    '$gte': start_date,
                    '$lte': end_date
                }
            }
            
            if collection_name:
                filter_query['collectionName'] = collection_name
            
            # Get all changes in the period
            changes = list(self.audit_trail.collection.find(filter_query))
            
            # Statistics
            stats = {
                'totalChanges': len(changes),
                'operationTypes': {},
                'collections': {},
                'users': {},
                'validationIssues': 0
            }
            
            validation_issues = []
            
            for change in changes:
                # Count by operation type
                op_type = change['operationType']
                stats['operationTypes'][op_type] = stats['operationTypes'].get(op_type, 0) + 1
                
                # Count by collection
                collection = change['collectionName']
                stats['collections'][collection] = stats['collections'].get(collection, 0) + 1
                
                # Count by user
                user_id = change.get('userId', 'system')
                stats['users'][user_id] = stats['users'].get(user_id, 0) + 1
                
                # Validate integrity
                if change.get('changeHash'):
                    validation = self.validate_change_integrity(str(change['_id']))
                    if not validation.get('valid'):
                        stats['validationIssues'] += 1
                        validation_issues.append({
                            'auditId': str(change['_id']),
                            'timestamp': change['timestamp'],
                            'collection': change['collectionName'],
                            'entityId': change['entityId'],
                            'validation': validation
                        })
            
            return {
                'success': True,
                'reportPeriod': {
                    'startDate': start_date,
                    'endDate': end_date,
                    'collection': collection_name
                },
                'statistics': stats,
                'validationIssues': validation_issues,
                'generatedAt': datetime.now()
            }
            
        except Exception as e:
            self.logger.error(f"Error generating compliance report: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_rollback_candidates(self, hours=24):
        """Get operations that can be safely rolled back"""
        try:
            candidates = self.audit_trail.get_rollback_candidates(hours)
            
            # Add safety checks for each candidate
            safe_candidates = []
            
            for candidate in candidates:
                safety_check = self._check_rollback_safety(candidate)
                if safety_check['safe']:
                    candidate['safetyCheck'] = safety_check
                    safe_candidates.append(candidate)
            
            return {
                'success': True,
                'candidates': safe_candidates,
                'totalCandidates': len(safe_candidates)
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _check_rollback_safety(self, audit_record):
        """Check if a rollback operation is safe to perform"""
        try:
            collection_name = audit_record['collectionName']
            entity_id = audit_record['entityId']
            
            # Check if there are dependent changes after this one
            dependent_changes = list(self.audit_trail.collection.find({
                'collectionName': collection_name,
                'entityId': entity_id,
                'timestamp': {'$gt': audit_record['timestamp']}
            }))
            
            if dependent_changes:
                return {
                    'safe': False,
                    'reason': f'Found {len(dependent_changes)} dependent changes after this operation',
                    'dependentChanges': len(dependent_changes)
                }
            
            # Check if entity still exists (for update/delete rollbacks)
            target_collection = self.db[collection_name]
            entity_exists = target_collection.find_one({'_id': ObjectId(entity_id)}) is not None
            
            if audit_record['operationType'] in ['update', 'delete'] and not entity_exists:
                return {
                    'safe': False,
                    'reason': 'Target entity no longer exists',
                    'dependentChanges': 0
                }
            
            return {
                'safe': True,
                'reason': 'Safe to rollback',
                'dependentChanges': 0
            }
            
        except Exception as e:
            return {
                'safe': False,
                'reason': f'Error checking safety: {str(e)}',
                'dependentChanges': 0
            }

# Global audit service instance
audit_service = AuditService()

def get_audit_service():
    """Get the global audit service instance"""
    return audit_service
